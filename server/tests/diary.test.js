import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'

const { createApp } = await import('../createApp.js')
const { supabase } = await import('../supabaseClient.js')
const { signToken } = await import('../middleware/auth.js')
const { DIARY_LIMIT, NOTE_LIMIT, parseDiaryInput } = await import('../services/diaryService.js')

test('diary input: dates, half stars, notes and partial edits are checked', () => {
  const now = new Date('2026-11-20T10:00:00Z')
  assert.deepEqual(parseDiaryInput({ watchedOn: '2026-11-19' }, { now }), { watched_on: '2026-11-19', stars: null, note: null, rewatch: false })
  assert.deepEqual(
    parseDiaryInput({ watchedOn: '2026-11-20', stars: 7, note: '  Loved the ending.\r\n ', rewatch: true }, { now }),
    { watched_on: '2026-11-20', stars: 7, note: 'Loved the ending.', rewatch: true }
  )
  // The member's day can be ahead of the server's, so tomorrow (UTC) is allowed, the day after is not.
  assert.equal(parseDiaryInput({ watchedOn: '2026-11-21' }, { now }).watched_on, '2026-11-21')
  for (const watchedOn of ['2026-11-22', '2026-02-30', '20-11-2026', '1899-12-31', '', 20261120, undefined]) {
    assert.throws(() => parseDiaryInput({ watchedOn }, { now }), /day/i, String(watchedOn))
  }
  for (const stars of [0, 11, 3.5, '4', true]) assert.throws(() => parseDiaryInput({ watchedOn: '2026-11-19', stars }, { now }), /star/)
  assert.throws(() => parseDiaryInput({ watchedOn: '2026-11-19', note: 'x'.repeat(NOTE_LIMIT + 1) }, { now }), /up to/)
  assert.equal(parseDiaryInput({ watchedOn: '2026-11-19', note: '   ' }, { now }).note, null)
  assert.throws(() => parseDiaryInput({ watchedOn: '2026-11-19', rewatch: 'yes' }, { now }), /rewatch/)
  assert.throws(() => parseDiaryInput(null, { now }), /Invalid/)
  assert.throws(() => parseDiaryInput([], { now }), /Invalid/)
  // Edits change only what was sent; an empty edit is refused.
  assert.deepEqual(parseDiaryInput({ stars: null }, { now, partial: true }), { stars: null })
  assert.deepEqual(parseDiaryInput({ note: 'Better second time' }, { now, partial: true }), { note: 'Better second time' })
  assert.throws(() => parseDiaryInput({}, { now, partial: true }), /Nothing to change/)
})

// In-memory stand-in for the tables the diary touches. No network, no database.
function fakeDatabase() {
  const db = {
    users: [{ id: 'u1', auth_version: 0, is_active: true }, { id: 'u2', auth_version: 0, is_active: true }],
    movies: [
      { id: 7, title: 'Kumbalangi Nights', year: 2019, genres: ['Drama'], origin_language: 'ml' },
      { id: 8, title: 'Memories of Murder', year: 2003, genres: ['Crime'], origin_language: 'ko' }
    ],
    watchlist: [{ user_id: 'u1', movie_id: 8, created_at: '2026-11-01T00:00:00.000Z' }],
    diary_entries: []
  }
  let clock = 0
  let seq = 0
  const from = (table) => {
    const filters = []
    let op = 'select'
    let payload = null
    let headCount = false
    let withMovie = false
    const matching = () => db[table].filter((row) => filters.every(([key, value]) => row[key] === value))
    const shape = (row) => (row ? { ...row, ...(withMovie ? { movies: db.movies.find((m) => m.id === row.movie_id) || null } : {}) } : null)
    const run = () => {
      if (op === 'insert') {
        const row = {
          id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
          created_at: new Date(Date.UTC(2026, 10, 20, 0, 0, clock++)).toISOString(),
          ...payload
        }
        db[table].push(row)
        return [row]
      }
      if (op === 'update') {
        const rows = matching()
        rows.forEach((row) => Object.assign(row, payload))
        return rows
      }
      if (op === 'delete') {
        const gone = new Set(matching())
        db[table] = db[table].filter((row) => !gone.has(row))
        return []
      }
      const rows = matching()
      if (table === 'diary_entries') rows.sort((a, b) => b.watched_on.localeCompare(a.watched_on) || b.created_at.localeCompare(a.created_at))
      return rows
    }
    const builder = {
      select(cols, options) { withMovie = String(cols).includes('movies('); headCount = Boolean(options?.head); return builder },
      insert(row) { op = 'insert'; payload = row; return builder },
      update(row) { op = 'update'; payload = row; return builder },
      delete() { op = 'delete'; return builder },
      eq(key, value) { filters.push([key, value]); return builder },
      order() { return builder },
      limit() { return builder },
      maybeSingle: async () => ({ data: shape(run()[0]), error: null }),
      single: async () => ({ data: shape(run()[0]), error: null }),
      then(resolve, reject) {
        try {
          if (headCount) return resolve({ count: matching().length, error: null })
          return resolve({ data: run().map(shape), error: null })
        } catch (error) {
          return reject(error)
        }
      }
    }
    return builder
  }
  return { db, from }
}

test('diary routes: log, list newest viewing first, edit, delete, private per member, capped', async () => {
  const original = supabase.from
  const fake = fakeDatabase()
  supabase.from = fake.from
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/v1/movies`
  const call = async (method, path, body, id = 'u1') => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { Authorization: `Bearer ${signToken({ id, authVersion: 0 })}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    return { status: res.status, body: await res.json() }
  }
  try {
    assert.equal((await fetch(`${base}/diary`)).status, 401)
    assert.deepEqual((await call('GET', '/diary')).body, { entries: [] })

    const first = await call('POST', '/8/diary', { watchedOn: '2026-11-10', stars: 9, note: 'The last shot.' })
    assert.equal(first.status, 201)
    assert.equal(first.body.entry.film.title, 'Memories of Murder')
    assert.equal(first.body.entry.stars, 9)
    // Watched it, so it left the watchlist.
    assert.equal(fake.db.watchlist.length, 0)

    // A rewatch is its own entry; an older viewing logged later still sorts by the day watched.
    await call('POST', '/8/diary', { watchedOn: '2026-11-18', rewatch: true })
    await call('POST', '/7/diary', { watchedOn: '2026-10-02', stars: 8 })
    const list = (await call('GET', '/diary')).body.entries
    assert.deepEqual(list.map((e) => [e.film.id, e.watchedOn, e.rewatch]), [[8, '2026-11-18', true], [8, '2026-11-10', false], [7, '2026-10-02', false]])

    // Bad input is refused without writing anything.
    assert.equal((await call('POST', '/7/diary', { watchedOn: '2999-01-01' })).status, 400)
    assert.equal((await call('POST', '/7/diary', { watchedOn: '2026-11-01', stars: 12 })).status, 400)
    assert.equal((await call('POST', '/abc/diary', { watchedOn: '2026-11-01' })).status, 400)
    assert.equal((await call('POST', '/404/diary', { watchedOn: '2026-11-01' })).status, 404)
    assert.equal(fake.db.diary_entries.length, 3)

    // Edit only what changed.
    const id = first.body.entry.id
    const edited = await call('PATCH', `/diary/${id}`, { stars: null, note: 'Even better than I remembered.' })
    assert.equal(edited.status, 200)
    assert.equal(edited.body.entry.stars, null)
    assert.equal(edited.body.entry.watchedOn, '2026-11-10')
    assert.equal((await call('PATCH', `/diary/${id}`, {})).status, 400)
    assert.equal((await call('PATCH', '/diary/not-an-id', { stars: 3 })).status, 400)

    // Another member cannot see, edit or delete it, and learns nothing about it.
    assert.deepEqual((await call('GET', '/diary', undefined, 'u2')).body, { entries: [] })
    assert.equal((await call('PATCH', `/diary/${id}`, { stars: 1 }, 'u2')).status, 404)
    await call('DELETE', `/diary/${id}`, undefined, 'u2')
    assert.equal(fake.db.diary_entries.length, 3)

    // Deleting is idempotent.
    assert.equal((await call('DELETE', `/diary/${id}`)).body.deleted, true)
    assert.equal((await call('DELETE', `/diary/${id}`)).status, 200)
    assert.equal((await call('GET', '/diary')).body.entries.length, 2)

    // A full diary refuses new entries.
    fake.db.diary_entries = Array.from({ length: DIARY_LIMIT }, (_, i) => ({ id: `x${i}`, user_id: 'u2', movie_id: 7, watched_on: '2026-01-01', created_at: '2026-01-01T00:00:00Z' }))
    const full = await call('POST', '/8/diary', { watchedOn: '2026-11-01' }, 'u2')
    assert.equal(full.status, 409)
    assert.equal(full.body.code, 'DIARY_FULL')
  } finally {
    supabase.from = original
    await new Promise((resolve) => server.close(resolve))
  }
})
