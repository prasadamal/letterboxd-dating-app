import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'

const { createApp } = await import('../createApp.js')
const { supabase } = await import('../supabaseClient.js')
const { signToken } = await import('../middleware/auth.js')
const { WATCHLIST_LIMIT } = await import('../services/watchlistService.js')

// A small in-memory stand-in for the three tables these routes touch. No network, no database.
function fakeDatabase() {
  const db = {
    users: [{ id: 'u1', auth_version: 0, is_active: true }, { id: 'u2', auth_version: 0, is_active: true }],
    movies: [
      { id: 7, title: 'Kumbalangi Nights', year: 2019, genres: ['Drama'], origin_language: 'ml' },
      { id: 8, title: 'Memories of Murder', year: 2003, genres: ['Crime'], origin_language: 'ko' }
    ],
    watchlist: []
  }
  let clock = 0
  const from = (table) => {
    const filters = []
    let op = 'select'
    let columns = '*'
    let headCount = false
    const matching = () => db[table].filter((row) => filters.every(([key, value]) => row[key] === value))
    const shape = (row) => {
      if (!row) return null
      if (table === 'watchlist' && columns.includes('movies(')) return { ...row, movies: db.movies.find((m) => m.id === row.movie_id) || null }
      return { ...row }
    }
    const builder = {
      select(cols, options) { columns = cols; headCount = Boolean(options?.head); return builder },
      eq(key, value) { filters.push([key, value]); return builder },
      order() { return builder },
      limit() { return builder },
      delete() { op = 'delete'; return builder },
      maybeSingle: async () => ({ data: shape(matching()[0]), error: null }),
      upsert: async (row) => {
        if (!db[table].some((r) => r.user_id === row.user_id && r.movie_id === row.movie_id)) {
          db[table].push({ ...row, created_at: new Date(Date.UTC(2026, 10, 19, 0, 0, clock++)).toISOString() })
        }
        return { error: null }
      },
      then(resolve, reject) {
        try {
          if (op === 'delete') {
            const gone = new Set(matching())
            db[table] = db[table].filter((row) => !gone.has(row))
            return resolve({ error: null })
          }
          if (headCount) return resolve({ count: matching().length, error: null })
          const rows = matching().map(shape)
          if (table === 'watchlist') rows.sort((a, b) => b.created_at.localeCompare(a.created_at))
          return resolve({ data: rows, error: null })
        } catch (error) {
          return reject(error)
        }
      }
    }
    return builder
  }
  return { db, from }
}

test('watchlist: save, list newest first, idempotent, private per member, validated, capped', async () => {
  const original = supabase.from
  const fake = fakeDatabase()
  supabase.from = fake.from
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/v1/movies`
  const as = (id) => ({ Authorization: `Bearer ${signToken({ id, authVersion: 0 })}` })
  const call = async (method, path, id = 'u1') => {
    const res = await fetch(`${base}${path}`, { method, headers: as(id) })
    return { status: res.status, body: await res.json() }
  }
  try {
    assert.equal((await fetch(`${base}/watchlist`)).status, 401)
    assert.deepEqual((await call('GET', '/watchlist')).body, { films: [] })

    assert.deepEqual((await call('PUT', '/7/watchlist')).body, { id: 7, saved: true })
    assert.deepEqual((await call('PUT', '/8/watchlist')).body, { id: 8, saved: true })
    // Saving again keeps one entry.
    assert.equal((await call('PUT', '/7/watchlist')).status, 200)
    assert.equal(fake.db.watchlist.length, 2)

    const list = (await call('GET', '/watchlist')).body.films
    assert.deepEqual(list.map((f) => f.id), [8, 7])
    assert.equal(list[1].title, 'Kumbalangi Nights')
    assert.ok(Array.isArray(list[1].genres))

    // Another member sees only their own list.
    assert.deepEqual((await call('GET', '/watchlist', 'u2')).body, { films: [] })

    // Bad and unknown ids are refused without touching the list.
    for (const bad of ['abc', '0', '-3', '1.5', '99999999999']) assert.equal((await call('PUT', `/${bad}/watchlist`)).status, 400, bad)
    const unknown = await call('PUT', '/404/watchlist')
    assert.equal(unknown.status, 404)
    assert.equal(fake.db.watchlist.length, 2)

    // Removing is idempotent.
    assert.deepEqual((await call('DELETE', '/7/watchlist')).body, { id: 7, saved: false })
    assert.deepEqual((await call('DELETE', '/7/watchlist')).body, { id: 7, saved: false })
    assert.deepEqual((await call('GET', '/watchlist')).body.films.map((f) => f.id), [8])

    // A full list refuses new films but still accepts one that is already saved.
    fake.db.watchlist = Array.from({ length: WATCHLIST_LIMIT }, (_, i) => ({ user_id: 'u2', movie_id: i === 0 ? 8 : 100000 + i, created_at: '2026-11-01T00:00:00.000Z' }))
    const full = await call('PUT', '/7/watchlist', 'u2')
    assert.equal(full.status, 409)
    assert.equal(full.body.code, 'WATCHLIST_FULL')
    assert.equal((await call('PUT', '/8/watchlist', 'u2')).status, 200)
  } finally {
    supabase.from = original
    await new Promise((resolve) => server.close(resolve))
  }
})
