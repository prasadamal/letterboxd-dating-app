import { test, describe, before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { startServer } from './helpers.js'
import { resolveJwtSecret, getAllowedOrigins, getJwtSecret } from '../server/config.js'
import { hashPassword, verifyPassword } from '../server/lib/security.js'
import { createRateLimiter } from '../server/middleware/rateLimit.js'
import { store, resetStore, computeCompatibility } from '../server/db.js'

let t
before(async () => { t = await startServer() })
after(async () => { await t.close() })
// Every test starts from the freshly seeded store so tests are order-independent.
beforeEach(() => resetStore())

describe('auth', () => {
  test('login works for demo user and never leaks password data', async () => {
    const res = await t.request('POST', '/api/auth/login', { body: { email: 'maya@example.com', password: '123456' } })
    assert.equal(res.status, 200)
    assert.ok(res.json.token)
    assert.equal(res.json.user.email, 'maya@example.com')
    assert.doesNotMatch(res.text, /password/i)
    assert.doesNotMatch(res.text, /scrypt\$/)
  })

  test('login is case-insensitive on email and rejects bad credentials', async () => {
    assert.equal((await t.request('POST', '/api/auth/login', { body: { email: 'MAYA@example.com', password: '123456' } })).status, 200)
    assert.equal((await t.request('POST', '/api/auth/login', { body: { email: 'maya@example.com', password: 'wrong' } })).status, 401)
    assert.equal((await t.request('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: '123456' } })).status, 401)
    assert.equal((await t.request('POST', '/api/auth/login', { body: {} })).status, 400)
  })

  test('passwords are stored hashed, not plaintext', async () => {
    const { status } = await t.signup({ email: 'hash-check@example.com', password: 'hunter2hunter2' })
    assert.equal(status, 201)
    const stored = store.users.find((u) => u.email === 'hash-check@example.com')
    assert.equal(stored.password, undefined)
    assert.match(stored.password_hash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
    assert.ok(!stored.password_hash.includes('hunter2'))
    assert.ok(store.users.every((u) => u.password === undefined && u.password_hash.startsWith('scrypt$')))
    assert.equal(await verifyPassword('hunter2hunter2', stored.password_hash), true)
    assert.equal(await verifyPassword('nope', stored.password_hash), false)
    // salted: same password hashes differently
    assert.notEqual(await hashPassword('x'.repeat(8)), await hashPassword('x'.repeat(8)))
  })

  test('signup returns token + sanitized user, then new user can log in', async () => {
    const { status, json, body, text } = await t.signup()
    assert.equal(status, 201)
    assert.ok(json.token)
    assert.doesNotMatch(text, /password/i)
    const token = await t.login(body.email, body.password)
    assert.ok(token)
  })

  test('signup assigns unique incrementing ids', async () => {
    const a = await t.signup()
    const b = await t.signup()
    assert.equal(b.json.user.id, a.json.user.id + 1)
    const ids = store.users.map((u) => u.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  test('signup rejects duplicate email (case-insensitive)', async () => {
    const first = await t.signup({ email: 'dupe@example.com' })
    assert.equal(first.status, 201)
    assert.equal((await t.signup({ email: 'DUPE@example.com' })).status, 409)
  })

  test('signup validates input', async () => {
    const cases = [
      [{ email: 'not-an-email' }, /email/i],
      [{ email: '' }, /email/i],
      [{ password: '12345' }, /password/i],
      [{ password: 123456 }, /password/i],
      [{ name: '' }, /name/i],
      [{ age: 17 }, /age/i],
      [{ age: 121 }, /age/i],
      [{ age: 'abc' }, /age/i],
      [{ age: 25.5 }, /age/i],
      [{ age: undefined }, /age/i],
      [{ hobbies: 42 }, /hobbies/i]
    ]
    for (const [override, pattern] of cases) {
      const res = await t.signup(override)
      assert.equal(res.status, 400, JSON.stringify(override))
      assert.match(res.json.message, pattern, JSON.stringify(override))
    }
    assert.equal((await t.signup({ age: 18 })).status, 201)
    assert.equal((await t.signup({ age: '40' })).status, 201)
    assert.equal((await t.signup({ password: '123456' })).status, 201)
  })

  test('/auth/me returns sanitized user for a valid token', async () => {
    const token = await t.login()
    const res = await t.request('GET', '/api/auth/me', { token })
    assert.equal(res.status, 200)
    assert.equal(res.json.user.id, 1)
    assert.doesNotMatch(res.text, /password/i)
  })

  test('/auth/me verifies the JWT signature, expiry and algorithm', async () => {
    // Unsigned / forged tokens that merely *decode* to a real user id must be rejected.
    const forged = jwt.sign({ id: 1, email: 'maya@example.com' }, 'attacker-secret')
    assert.equal((await t.request('GET', '/api/auth/me', { token: forged })).status, 401)

    const noneAlg = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"id":1}').toString('base64url')}.`
    assert.equal((await t.request('GET', '/api/auth/me', { token: noneAlg })).status, 401)

    const expired = jwt.sign({ id: 1, email: 'maya@example.com' }, getJwtSecret(), { expiresIn: -10 })
    assert.equal((await t.request('GET', '/api/auth/me', { token: expired })).status, 401)

    const tampered = (await t.login()).split('.')
    tampered[1] = Buffer.from(JSON.stringify({ id: 2, email: 'anna@example.com' })).toString('base64url')
    assert.equal((await t.request('GET', '/api/auth/me', { token: tampered.join('.') })).status, 401)

    assert.equal((await t.request('GET', '/api/auth/me')).status, 401)
    assert.equal((await t.request('GET', '/api/auth/me', { headers: { Authorization: 'Basic abc' } })).status, 401)
  })

  test('protected routes require auth', async () => {
    for (const [method, path] of [
      ['GET', '/api/matches'], ['GET', '/api/matches/2'], ['POST', '/api/matches/2/like'], ['POST', '/api/matches/2/pass'],
      ['GET', '/api/movies'], ['GET', '/api/movies/daily'], ['POST', '/api/movies/1/rate'],
      ['GET', '/api/users/profile'], ['PUT', '/api/users/profile'],
      ['GET', '/api/messages/2'], ['POST', '/api/messages/2']
    ]) {
      assert.equal((await t.request(method, path)).status, 401, `${method} ${path}`)
    }
  })

  test('rate limiter unit: blocks after max per client, isolates clients', async () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 })
    const statuses = []
    for (let i = 0; i < 5; i += 1) {
      const res = { setHeader() {}, status(code) { statuses.push(code); return { json() {} } } }
      limiter({ ip: '1.2.3.4' }, res, () => statuses.push(200))
    }
    assert.deepEqual(statuses, [200, 200, 200, 429, 429])
    // different client is unaffected
    const other = []
    limiter({ ip: '5.6.7.8' }, { setHeader() {}, status() { return { json() {} } } }, () => other.push('ok'))
    assert.deepEqual(other, ['ok'])
  })
})

describe('config', () => {
  test('production refuses default/missing/short JWT secrets', () => {
    for (const JWT_SECRET of [undefined, '', 'change-this-secret-for-production', 'dev-secret-key', 'short']) {
      assert.throws(() => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET }), /JWT_SECRET/)
    }
    assert.equal(resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a-long-unique-secret-value' }), 'a-long-unique-secret-value')
  })

  test('development warns on default secret and generates one when unset', () => {
    const warnings = []
    resolveJwtSecret({ NODE_ENV: 'development', JWT_SECRET: 'change-this-secret-for-production' }, (m) => warnings.push(m))
    const generated = resolveJwtSecret({}, (m) => warnings.push(m))
    assert.equal(warnings.length, 2)
    assert.ok(generated.length >= 32)
  })

  test('CORS origins come from CLIENT_URL (comma separated); none in production by default', () => {
    assert.deepEqual(getAllowedOrigins({ CLIENT_URL: 'https://a.com, https://b.com' }), ['https://a.com', 'https://b.com'])
    assert.equal(getAllowedOrigins({ NODE_ENV: 'production' }), false)
    assert.deepEqual(getAllowedOrigins({}), ['http://localhost:3000'])
  })

  test('CORS: only allowed origins get Access-Control-Allow-Origin', async () => {
    const ok = await t.request('GET', '/api/health', { headers: { Origin: 'http://localhost:3000' } })
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:3000')
    const evil = await t.request('GET', '/api/health', { headers: { Origin: 'https://evil.example' } })
    assert.equal(evil.headers.get('access-control-allow-origin'), null)
  })
})

describe('profile', () => {
  test('GET/PUT profile; fields can be cleared; invalid values rejected; password not leaked', async () => {
    const { json } = await t.signup({ bio: 'hello', city: 'Rome' })
    const token = json.token
    const get = await t.request('GET', '/api/users/profile', { token })
    assert.equal(get.json.user.bio, 'hello')
    assert.doesNotMatch(get.text, /password/i)

    const cleared = await t.request('PUT', '/api/users/profile', { token, body: { bio: '', hobbies: [] } })
    assert.equal(cleared.status, 200)
    assert.equal(cleared.json.user.bio, '')
    assert.deepEqual(cleared.json.user.hobbies, [])
    assert.equal(cleared.json.user.city, 'Rome') // untouched
    assert.doesNotMatch(cleared.text, /password/i)

    const hobbies = await t.request('PUT', '/api/users/profile', { token, body: { hobbies: 'a, b ,,c' } })
    assert.deepEqual(hobbies.json.user.hobbies, ['a', 'b', 'c'])

    assert.equal((await t.request('PUT', '/api/users/profile', { token, body: { name: '' } })).status, 400)
    assert.equal((await t.request('PUT', '/api/users/profile', { token, body: { age: 10 } })).status, 400)
  })

  test('profile update cannot overwrite id/email/password hash (mass assignment)', async () => {
    const { json, body } = await t.signup()
    await t.request('PUT', '/api/users/profile', { token: json.token, body: { id: 999, email: 'x@y.z', password_hash: 'x', loved: ['Hack'] } })
    const me = await t.request('GET', '/api/auth/me', { token: json.token })
    assert.equal(me.json.user.id, json.user.id)
    assert.equal(me.json.user.email, body.email.toLowerCase())
    assert.deepEqual(me.json.user.loved, [])
    assert.ok(await t.login(body.email, body.password))
  })
})

describe('matching', () => {
  test('GET /matches lists other users, sorted, without secrets or emails', async () => {
    const token = await t.login()
    const res = await t.request('GET', '/api/matches', { token })
    assert.equal(res.status, 200)
    assert.equal(res.json.matches.length, 2)
    assert.ok(res.json.matches.every((m) => m.id !== 1))
    assert.doesNotMatch(res.text, /password|scrypt\$/i)
    assert.ok(res.json.matches.every((m) => m.email === undefined))
    const scores = res.json.matches.map((m) => m.score)
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a))
  })

  test('compatibility score is deterministic: 55 + 12*sharedLoved + 8*sharedHated, capped at 99', async () => {
    const maya = store.users[0]
    const anna = store.users[1]
    // Maya & Anna share 3 loved (Shawshank, Godfather, Moonlight) and 1 hated (Marvel Cinematic Universe)
    assert.equal(computeCompatibility(maya, anna), 55 + 3 * 12 + 1 * 8)
    assert.equal(computeCompatibility({ loved: Array.from({ length: 10 }, (_, i) => i), hated: [] }, { loved: Array.from({ length: 10 }, (_, i) => i), hated: [] }), 99)

    const token = await t.login()
    const list = await t.request('GET', '/api/matches', { token })
    const annaFromList = list.json.matches.find((m) => m.id === 2)
    assert.equal(annaFromList.score, 99)
    // detail endpoint returns the SAME score every time (was random before)
    const scores = new Set()
    for (let i = 0; i < 5; i += 1) {
      const detail = await t.request('GET', '/api/matches/2', { token })
      assert.equal(detail.status, 200)
      scores.add(detail.json.match.score)
      assert.doesNotMatch(detail.text, /password/i)
    }
    assert.deepEqual([...scores], [annaFromList.score])
  })

  test('GET /matches/:id 404s for unknown/self/invalid ids', async () => {
    const token = await t.login()
    for (const id of ['9999', '1', 'abc', '-3', '1.5']) {
      assert.equal((await t.request('GET', `/api/matches/${id}`, { token })).status, 404, id)
    }
  })

  test('rating movies changes compatibility', async () => {
    const { json } = await t.signup()
    const token = json.token
    const before = (await t.request('GET', '/api/matches', { token })).json.matches.find((m) => m.id === 1).score
    assert.equal(before, 55)
    await t.request('POST', '/api/movies/1/rate', { token, body: { reaction: 'love' } }) // Shawshank, loved by Maya
    const after = (await t.request('GET', '/api/matches', { token })).json.matches.find((m) => m.id === 1).score
    assert.equal(after, 67)
  })
})

describe('likes, passes and mutual matches', () => {
  test('like validates the target', async () => {
    const token = await t.login()
    assert.equal((await t.request('POST', '/api/matches/9999/like', { token })).status, 404)
    assert.equal((await t.request('POST', '/api/matches/abc/like', { token })).status, 404)
    assert.equal((await t.request('POST', '/api/matches/1/like', { token })).status, 400)
    assert.equal(store.likes.some((l) => l.to_user_id === 9999), false)
  })

  test('one-way like is not a match; duplicates are ignored; mutual like returns matched:true', async () => {
    const a = await t.signup()
    const b = await t.signup()
    const idA = a.json.user.id
    const idB = b.json.user.id

    const first = await t.request('POST', `/api/matches/${idB}/like`, { token: a.json.token })
    assert.deepEqual(first.json, { ok: true, alreadyLiked: false, matched: false })

    const dup = await t.request('POST', `/api/matches/${idB}/like`, { token: a.json.token })
    assert.deepEqual(dup.json, { ok: true, alreadyLiked: true, matched: false })
    assert.equal(store.likes.filter((l) => l.from_user_id === idA && l.to_user_id === idB).length, 1)

    const mutual = await t.request('POST', `/api/matches/${idA}/like`, { token: b.json.token })
    assert.deepEqual(mutual.json, { ok: true, alreadyLiked: false, matched: true })

    const mutualList = await t.request('GET', '/api/matches/mutual', { token: a.json.token })
    assert.deepEqual(mutualList.json.matches.map((m) => m.id), [idB])
    const seen = (await t.request('GET', `/api/matches/${idB}`, { token: a.json.token })).json.match
    assert.equal(seen.liked, true)
    assert.equal(seen.matched, true)
  })

  test('pass hides a user from the list; a later like brings them back', async () => {
    const { json } = await t.signup()
    const token = json.token
    assert.equal((await t.request('POST', '/api/matches/3/pass', { token })).status, 200)
    assert.equal((await t.request('POST', '/api/matches/3/pass', { token })).status, 200)
    assert.equal(store.passes.filter((p) => p.from_user_id === json.user.id).length, 1)
    let list = (await t.request('GET', '/api/matches', { token })).json.matches
    assert.ok(!list.some((m) => m.id === 3))
    assert.equal((await t.request('POST', '/api/matches/9999/pass', { token })).status, 404)
    await t.request('POST', '/api/matches/3/like', { token })
    list = (await t.request('GET', '/api/matches', { token })).json.matches
    assert.ok(list.some((m) => m.id === 3))
  })

  test('demo user is already liked by seeded users so Maya can match instantly', async () => {
    const token = await t.login()
    const res = await t.request('POST', '/api/matches/2/like', { token })
    assert.equal(res.json.matched, true)
  })
})

describe('messages', () => {
  test('require auth; only mutually matched users can read/send', async () => {
    const maya = await t.login()
    const unauth = await t.request('GET', '/api/messages/2')
    assert.equal(unauth.status, 401)

    // not matched yet (Maya has not liked Luca; Luca liked Maya)
    assert.equal((await t.request('GET', '/api/messages/3', { token: maya })).status, 403)
    assert.equal((await t.request('POST', '/api/messages/3', { token: maya, body: { body: 'hello' } })).status, 403)
    assert.equal((await t.request('GET', '/api/messages/9999', { token: maya })).status, 404)
    assert.equal((await t.request('GET', '/api/messages/1', { token: maya })).status, 404)
  })

  test('matched users can exchange messages; a third party cannot read them', async () => {
    const maya = await t.login()
    const anna = await t.login('anna@example.com', '123456')
    const luca = await t.login('luca@example.com', '123456')
    assert.equal((await t.request('POST', '/api/matches/2/like', { token: maya })).json.matched, true)

    const sent = await t.request('POST', '/api/messages/2', { token: maya, body: { body: '  Favorite Kurosawa?  ' } })
    assert.equal(sent.status, 201)
    assert.equal(sent.json.message.body, 'Favorite Kurosawa?')
    assert.equal(sent.json.message.from_user_id, 1)
    assert.equal(sent.json.message.to_user_id, 2)

    await t.request('POST', '/api/messages/1', { token: anna, body: { body: 'Ran!' } })

    const asAnna = await t.request('GET', '/api/messages/1', { token: anna })
    assert.equal(asAnna.status, 200)
    assert.deepEqual(asAnna.json.messages.map((m) => m.body), ['Favorite Kurosawa?', 'Ran!'])
    assert.equal(asAnna.json.with.name, 'Maya')
    const asMaya = await t.request('GET', '/api/messages/2', { token: maya })
    assert.deepEqual(asMaya.json.messages.map((m) => m.body), ['Favorite Kurosawa?', 'Ran!'])

    // Luca is not part of the conversation
    assert.equal((await t.request('GET', '/api/messages/1', { token: luca })).status, 403)
    assert.equal((await t.request('GET', '/api/messages/2', { token: luca })).status, 403)
  })

  test('message body is validated', async () => {
    const maya = await t.login()
    await t.request('POST', '/api/matches/2/like', { token: maya })
    for (const body of [{}, { body: '' }, { body: '   ' }, { body: 5 }, { body: 'x'.repeat(1001) }]) {
      assert.equal((await t.request('POST', '/api/messages/2', { token: maya, body })).status, 400, JSON.stringify(body).slice(0, 30))
    }
  })
})

describe('movies', () => {
  test('catalog comes from movieCatalog (deduplicated by title), not the 12-movie stub', async () => {
    const token = await t.login()
    const res = await t.request('GET', '/api/movies', { token })
    assert.equal(res.status, 200)
    assert.ok(res.json.movies.length > 200)
    const titles = res.json.movies.map((m) => m.title)
    assert.equal(new Set(titles).size, titles.length)
    assert.equal(new Set(res.json.movies.map((m) => m.id)).size, res.json.movies.length)
  })

  test('daily returns 5 unique movies', async () => {
    const { json } = await t.signup()
    const res = await t.request('GET', '/api/movies/daily', { token: json.token })
    assert.equal(res.json.movies.length, 5)
    assert.equal(new Set(res.json.movies.map((m) => m.id)).size, 5)
  })

  test('love / hate update taste profile and move between lists', async () => {
    const { json } = await t.signup()
    const token = json.token
    const love = await t.request('POST', '/api/movies/2/rate', { token, body: { reaction: 'love' } })
    assert.equal(love.status, 200)
    assert.deepEqual(love.json.user.loved, ['The Godfather'])
    assert.doesNotMatch(love.text, /password/i)
    const hate = await t.request('POST', '/api/movies/2/rate', { token, body: { reaction: 'hate' } })
    assert.deepEqual(hate.json.user.loved, [])
    assert.deepEqual(hate.json.user.hated, ['The Godfather'])
  })

  test('skip is accepted, leaves taste untouched, and is not offered again', async () => {
    const { json } = await t.signup()
    const token = json.token
    const skip = await t.request('POST', '/api/movies/5/rate', { token, body: { reaction: 'skip' } })
    assert.equal(skip.status, 200)
    assert.deepEqual(skip.json.user.loved, [])
    assert.deepEqual(skip.json.user.hated, [])
    for (let i = 0; i < 30; i += 1) {
      const daily = await t.request('GET', '/api/movies/daily', { token })
      assert.ok(!daily.json.movies.some((m) => m.id === 5))
    }
  })

  test('daily excludes already rated (loved/hated) movies, including seeded ones', async () => {
    const token = await t.login() // Maya has loved Shawshank (id 1), Godfather (2), Spirited Away (3), Moonlight (4)
    await t.request('POST', '/api/movies/6/rate', { token, body: { reaction: 'hate' } })
    for (let i = 0; i < 40; i += 1) {
      const ids = (await t.request('GET', '/api/movies/daily', { token })).json.movies.map((m) => m.id)
      for (const rated of [1, 2, 3, 4, 6]) assert.ok(!ids.includes(rated), `movie ${rated} should be excluded`)
    }
  })

  test('daily shrinks to what is left and then empties', async () => {
    const { json } = await t.signup()
    const token = json.token
    const all = (await t.request('GET', '/api/movies', { token })).json.movies
    for (const movie of all.slice(0, all.length - 3)) {
      await t.request('POST', `/api/movies/${movie.id}/rate`, { token, body: { reaction: 'skip' } })
    }
    assert.equal((await t.request('GET', '/api/movies/daily', { token })).json.movies.length, 3)
    for (const movie of all.slice(-3)) await t.request('POST', `/api/movies/${movie.id}/rate`, { token, body: { reaction: 'skip' } })
    assert.deepEqual((await t.request('GET', '/api/movies/daily', { token })).json.movies, [])
  })

  test('rate validates reaction and movie id', async () => {
    const { json } = await t.signup()
    const token = json.token
    assert.equal((await t.request('POST', '/api/movies/1/rate', { token, body: { reaction: 'meh' } })).status, 400)
    assert.equal((await t.request('POST', '/api/movies/1/rate', { token, body: {} })).status, 400)
    assert.equal((await t.request('POST', '/api/movies/99999/rate', { token, body: { reaction: 'love' } })).status, 404)
  })
})

describe('server hardening', () => {
  test('unknown API routes return JSON 404', async () => {
    const res = await t.request('GET', '/api/nope')
    assert.equal(res.status, 404)
    assert.equal(res.json.message, 'Endpoint not found')
  })

  test('global error handler: malformed JSON -> 400 JSON, oversized -> 413, no stack leak', async () => {
    const bad = await t.request('POST', '/api/auth/login', { body: '{"email": ', headers: { 'Content-Type': 'application/json' } })
    assert.equal(bad.status, 400)
    assert.equal(bad.json.message, 'Invalid JSON body')
    assert.doesNotMatch(bad.text, /at .*\.js/)
    const big = await t.request('POST', '/api/auth/login', { body: { email: 'a@b.co', password: 'x'.repeat(200_000) } })
    assert.equal(big.status, 413)
  })

  test('security headers set and x-powered-by hidden', async () => {
    const res = await t.request('GET', '/api/health')
    assert.equal(res.headers.get('x-powered-by'), null)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  })
})
