import test from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET = 'isolated-chat-contract-test'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-role'
const { createApp } = await import('../createApp.js')
const { signToken } = await import('../middleware/auth.js')
const { supabase } = await import('../supabaseClient.js')

test('both API aliases expose the viewer hello gate and keep closed conversations unavailable', async () => {
  const viewer = '00000000-0000-4000-8000-000000000001'
  const peer = '00000000-0000-4000-8000-000000000002'
  const original = supabase.from
  let blocked = false
  let match = { id: 'match', user_a_intro_sent: false, user_b_intro_sent: false, chat_unlocked: false }
  supabase.from = table => {
    const data = () => ({ data: table === 'users' ? { id: viewer, is_active: true } :
      table === 'blocks' ? (blocked ? [{ blocker_id: peer }] : []) :
      table === 'matches' ? match : table === 'conversations' ? { id: 'conversation' } : [], error: null })
    const query = { select() { return this }, eq() { return this }, or() { return this },
      limit() { return this }, order() { return this }, maybeSingle: async () => data(),
      then(resolve, reject) { return Promise.resolve(data()).then(resolve, reject) } }
    return query
  }
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const base = `http://127.0.0.1:${server.address().port}`
    for (const prefix of ['/api', '/api/v1']) {
      for (const [sent, unlocked, intro, waiting] of [
        [false, false, true, false], [true, false, false, true], [true, true, false, false]
      ]) {
        match = { ...match, user_a_intro_sent: sent, chat_unlocked: unlocked }
        const response = await fetch(`${base}${prefix}/messages/${peer}`, { headers: { Authorization: `Bearer ${signToken({ id: viewer })}` } })
        assert.equal(response.status, 200)
        const body = await response.json()
        assert.equal(body.introPending, intro)
        assert.equal(body.waitingOnPeer, waiting)
        assert.equal(body.chatUnlocked, unlocked)
        assert.deepEqual(body.messages, [])
      }
    }
    blocked = true
    const response = await fetch(`${base}/api/v1/messages/${peer}`, { headers: { Authorization: `Bearer ${signToken({ id: viewer })}` } })
    assert.equal(response.status, 404)
  } finally {
    supabase.from = original
    await new Promise(resolve => server.close(resolve))
  }
})
