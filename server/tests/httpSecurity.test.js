import test from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'
const { createApp } = await import('../createApp.js')
const { supabase } = await import('../supabaseClient.js')

test('HTTP logout requires authentication, malformed refresh is rejected, and failed probes respond', async () => {
  const originalFrom = supabase.from
  const originalList = supabase.storage.from
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    let writes = 0
    supabase.from = () => { writes++; throw new Error('simulated database outage') }
    for (const prefix of ['/api', '/api/v1']) {
      const logout = await fetch(`${base}${prefix}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      assert.equal(logout.status, 401)
      assert.equal(logout.headers.get('cache-control'), 'no-store')
      const refresh = await fetch(`${base}${prefix}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: {} }) })
      assert.equal(refresh.status, 400)
    }
    assert.equal(writes, 0)
    const dbHealth = await fetch(`${base}/api/v1/health/db`)
    assert.equal(dbHealth.status, 500)
    assert.equal((await dbHealth.json()).message, 'Internal server error')
    supabase.storage.from = () => ({ list: async () => { throw new Error('storage outage') } })
    assert.equal((await fetch(`${base}/api/v1/health/storage`)).status, 500)
  } finally {
    supabase.from = originalFrom
    supabase.storage.from = originalList
    await new Promise(resolve => server.close(resolve))
  }
})
