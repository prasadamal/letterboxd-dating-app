import { test } from 'node:test'
import assert from 'node:assert/strict'

// Separate file => separate process, so this strict limit does not affect other tests.
process.env.AUTH_RATE_LIMIT_MAX = '3'

test('login and signup endpoints return 429 with Retry-After after too many attempts', async () => {
  const { startServer } = await import('./helpers.js')
  const t = await startServer()
  try {
    const codes = []
    for (let i = 0; i < 5; i += 1) {
      const res = await t.request('POST', '/api/auth/login', { body: { email: 'maya@example.com', password: 'wrong' } })
      codes.push(res.status)
      if (res.status === 429) assert.ok(Number(res.headers.get('retry-after')) > 0)
    }
    assert.deepEqual(codes, [401, 401, 401, 429, 429])
    // limiter is shared by signup
    assert.equal((await t.signup()).status, 429)
    // other endpoints are not limited
    assert.equal((await t.request('GET', '/api/health')).status, 200)
  } finally {
    await t.close()
  }
})
