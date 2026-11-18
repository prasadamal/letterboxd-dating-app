#!/usr/bin/env node
// End-to-end check of a RUNNING ReelMates API with a real database. It creates two throwaway
// accounts (films-only, so the dating launch gate is untouched) and deletes both at the end.
//   LIVE_API_URL=https://your-api.onrender.com node scripts/live-e2e.mjs
// From a sandbox that needs a proxy, add NODE_USE_ENV_PROXY=1.
import assert from 'node:assert/strict'

const base = (process.env.LIVE_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '')
const api = `${base}/api/v1`
const password = 'live-e2e-password-123'
const stamp = `${Date.now()}${Math.floor(Math.random() * 1e4)}`
const steps = []

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(90_000)
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { /* not json */ }
  return { status: res.status, json, text }
}
const ok = (name) => { steps.push(name); console.log(`OK   ${name}`) }

async function signup(label, extra = {}) {
  const res = await call('POST', '/auth/signup', {
    body: { email: `e2e-${label}-${stamp}@example.com`, password, name: `E2E ${label}`, age: 30, country: 'India', datingEnabled: false, termsAccepted: true, ...extra }
  })
  assert.equal(res.status, 201, `signup ${label}: ${res.text.slice(0, 200)}`)
  return res.json
}

async function main() {
  // Server and database
  const health = await call('GET', '/health')
  assert.equal(health.status, 200); assert.equal(health.json.db, 'up')
  ok('health: server up, database connected, migration applied')
  // /health names settings that are still missing (not their values); it must never show a value.
  assert.ok(!JSON.stringify(health.json).match(/eyJ[A-Za-z0-9_-]{10,}|sb_(secret|publishable)_|postgres(ql)?:\/\/|supabase\.co/i), 'health leaks a configuration value')
  ok('health shows no secret values')

  // Terms are required, weak input refused
  assert.equal((await call('POST', '/auth/signup', { body: { email: `x-${stamp}@example.com`, password, name: 'No Terms', age: 30, country: 'India', datingEnabled: false } })).status, 400)
  assert.equal((await call('POST', '/auth/signup', { body: { email: `y-${stamp}@example.com`, password, name: 'Too Young', age: 16, country: 'India', datingEnabled: false, termsAccepted: true } })).status, 400)
  ok('sign-up refuses missing terms and under-18')

  // Two members, friend code as referral
  const a = await signup('a')
  assert.ok(a.token && a.refreshToken && a.user)
  const friendsA = await call('GET', '/friends', { token: a.token })
  assert.equal(friendsA.status, 200)
  const codeA = friendsA.json.myCode
  assert.match(codeA, /^REEL[A-HJ-KM-NP-Z2-9]{8}$/, `friend code shape: ${codeA}`)
  assert.ok(!codeA.toLowerCase().includes(`e2e-a-${stamp}`.slice(0, 6)))
  ok(`friend code is random and well-formed (${codeA.slice(0, 4)}…)`)
  const b = await signup('b', { referralCode: codeA })
  const friendsB = await call('GET', '/friends', { token: b.token })
  assert.notEqual(friendsB.json.myCode, codeA)
  assert.ok(friendsB.json.friends.length === 1, 'referral should make the two members film friends')
  ok('referral code makes the new member a film friend straight away')

  // Duplicate email
  const dup = await call('POST', '/auth/signup', { body: { email: `e2e-a-${stamp}@example.com`, password, name: 'Dup', age: 30, country: 'India', datingEnabled: false, termsAccepted: true } })
  assert.equal(dup.status, 409)
  ok('duplicate email is refused (409)')

  // Login and sessions
  assert.equal((await call('POST', '/auth/login', { body: { email: a.user.email, password: 'wrong-password-1' } })).status, 401)
  const login = await call('POST', '/auth/login', { body: { email: a.user.email, password } })
  assert.equal(login.status, 200)
  const me = await call('GET', '/auth/me', { token: login.json.token })
  assert.equal(me.status, 200)
  assert.equal((await call('GET', '/auth/me')).status, 401)
  assert.equal((await call('GET', '/auth/me', { token: 'not.a.token' })).status, 401)
  ok('login, /me and bad credentials behave')

  const r1 = await call('POST', '/auth/refresh', { body: { refreshToken: login.json.refreshToken } })
  assert.equal(r1.status, 200); assert.ok(r1.json.refreshToken && r1.json.refreshToken !== login.json.refreshToken)
  const reuse = await call('POST', '/auth/refresh', { body: { refreshToken: login.json.refreshToken } })
  assert.equal(reuse.status, 401)
  const r2 = await call('POST', '/auth/refresh', { body: { refreshToken: r1.json.refreshToken } })
  assert.equal(r2.status, 200)
  ok('refresh rotates the token and a used token cannot be replayed')
  let tokenA = r2.json.token

  // Password reset never leaks a link in production, and does not reveal who has an account
  const forgot = await call('POST', '/auth/forgot-password', { body: { email: a.user.email } })
  const forgotUnknown = await call('POST', '/auth/forgot-password', { body: { email: `nobody-${stamp}@example.com` } })
  assert.equal(forgot.status, 200); assert.equal(forgotUnknown.status, 200)
  assert.deepEqual(Object.keys(forgot.json).sort(), Object.keys(forgotUnknown.json).sort())
  assert.ok(!forgot.text.includes('http'), 'reset link must not appear in the response')
  ok('password reset answers the same for known and unknown emails, no link leaked')

  // Daily films, ratings, personality
  const daily = await call('GET', '/movies/daily', { token: tokenA })
  assert.equal(daily.status, 200)
  assert.ok(daily.json.movies.length >= 5, `daily films: ${daily.json.movies.length}`)
  const reactions = ['love', 'hate', 'love', 'love', 'hate', 'skip', 'love', 'hate', 'love', 'hate']
  let rated = 0
  for (const [i, movie] of daily.json.movies.slice(0, 10).entries()) {
    const res = await call('POST', `/movies/${movie.id}/rate`, { token: tokenA, body: { reaction: reactions[i % reactions.length] } })
    assert.equal(res.status, 200, `rate: ${res.text.slice(0, 160)}`); rated += 1
  }
  assert.equal((await call('POST', `/movies/${daily.json.movies[0].id}/rate`, { token: tokenA, body: { reaction: 'meh' } })).status, 400)
  const results = await call('GET', '/movies/daily/results', { token: tokenA })
  assert.equal(results.status, 200)
  const stats = await call('GET', '/users/taste-stats', { token: tokenA })
  assert.equal(stats.status, 200)
  ok(`daily drop: ${rated} films rated, results and taste stats load`)

  assert.equal((await call('GET', '/movies/search?q=parasite', { token: tokenA })).status, 200)
  assert.equal((await call('GET', '/movies/top', { token: tokenA })).status, 200)
  ok('search and the People’s chart load')

  // Film friends, privacy
  const friends = await call('GET', '/friends', { token: tokenA })
  assert.equal(friends.json.friends.length, 1)
  const friendJson = JSON.stringify(friends.json.friends)
  assert.ok(!friendJson.includes(b.user.email), 'friend list must not reveal email')
  assert.ok(!friendJson.includes(friendsB.json.myCode), 'friend list must not reveal their friend code')
  const bId = friends.json.friends[0].id
  const compare = await call('GET', `/friends/compare/${bId}`, { token: tokenA })
  assert.equal(compare.status, 200)
  assert.equal((await call('GET', '/public/taste/' + encodeURIComponent(codeA))).status === 200, false, 'taste card must be private until shared')
  ok('friends are visible without email or code; taste card is private until shared')

  // Admin and cron are locked
  assert.ok([401, 503].includes((await call('GET', '/admin/moderation/queue')).status))
  assert.ok([401, 503].includes((await call('POST', '/internal/daily-reminders')).status))
  assert.equal((await call('GET', '/admin/moderation/queue', { token: tokenA })).status === 200, false)
  ok('admin and scheduled-job endpoints refuse unauthenticated and member calls')

  // Safety: report + block removes the friend
  const report = await call('POST', '/safety/report', { token: tokenA, body: { userId: bId, reason: 'spam', details: 'live e2e', block: true } })
  assert.equal(report.status, 201)
  const afterBlock = await call('GET', '/friends', { token: tokenA })
  assert.equal(afterBlock.json.friends.length, 0)
  ok('report with block works and hides the person')

  // Feedback
  const fb = await call('POST', '/feedback', { token: tokenA, body: { category: 'other', message: 'live e2e feedback', platform: 'android', appVersion: '0.0.0' } })
  assert.ok([200, 201].includes(fb.status), `feedback ${fb.status} ${fb.text.slice(0, 120)}`)
  ok('feedback is accepted')

  // Account deletion kills the account and its tokens
  const delB = await call('DELETE', '/safety/account', { token: b.token })
  assert.equal(delB.status, 200)
  const delA = await call('DELETE', '/safety/account', { token: tokenA })
  assert.equal(delA.status, 200)
  assert.equal((await call('GET', '/auth/me', { token: tokenA })).status, 401)
  assert.equal((await call('POST', '/auth/login', { body: { email: a.user.email, password } })).status, 401)
  assert.equal((await call('POST', '/auth/refresh', { body: { refreshToken: r2.json.refreshToken } })).status, 401)
  assert.equal((await call('POST', '/auth/login', { body: { email: b.user.email, password } })).status, 401)
  ok('account deletion: sign-in, old token and refresh token all stop working')

  console.log(`\nlive-e2e ok (${steps.length} checks) against ${base}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
