import test from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'
const { supabase } = await import('../supabaseClient.js')
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = await import('../services/authService.js')
const { unregisterPushToken } = await import('../services/notificationService.js')
const { resetPassword } = await import('../services/authLifecycleService.js')

test('session RPC failures propagate and invalid claims do not create sessions', async () => {
  const original = supabase.rpc
  try {
    supabase.rpc = async () => ({ error: new Error('database unavailable') })
    await assert.rejects(issueRefreshToken('user', 2), /database unavailable/)
    await assert.rejects(rotateRefreshToken('token'), /database unavailable/)
    await assert.rejects(resetPassword('reset-token', 'new-password'), /database unavailable/)
    supabase.rpc = async () => ({ data: false })
    await assert.rejects(issueRefreshToken('user', 2), err => err.status === 401)
    await assert.rejects(resetPassword('reset-token', 'new-password'), err => err.code === 'INVALID_TOKEN')
    supabase.rpc = async (name, args) => {
      assert.equal(name, 'rotate_refresh_token')
      assert.equal(args.p_next_hash.length, 64)
      assert.notEqual(args.p_token_hash, 'token')
      return { data: [{ user_id: 'user', auth_version: 3 }] }
    }
    const rotated = await rotateRefreshToken('token')
    assert.equal(rotated.userId, 'user')
    assert.equal(rotated.authVersion, 3)
    assert.equal(rotated.refreshToken.length, 96)
    supabase.rpc = async () => ({ data: [] })
    assert.equal(await rotateRefreshToken('token'), null)
  } finally { supabase.rpc = original }
})

test('logout scopes token mutations to the authenticated owner', async () => {
  const original = supabase.from
  try {
    for (const [table, mutate] of [
      ['push_tokens', () => unregisterPushToken('ExpoPushToken[device]', 'owner')],
      ['refresh_tokens', () => revokeRefreshToken('token', 'owner')]
    ]) {
      const filters = []
      supabase.from = name => {
        assert.equal(name, table)
        return { delete() { return this }, update() { return this }, eq(key, value) { filters.push([key, value]); return this }, then(resolve) { return Promise.resolve({ error: null }).then(resolve) } }
      }
      await mutate()
      assert.ok(filters.some(([key, value]) => key === 'user_id' && value === 'owner'))
    }
    await assert.rejects(unregisterPushToken('token'), /owner required/)
    await assert.rejects(revokeRefreshToken('token'), /owner required/)
  } finally { supabase.from = original }
})

test('suspended, deleted, missing and password-reset sessions are rejected', async () => {
  const { authMiddleware, signToken } = await import('../middleware/auth.js')
  const original = supabase.from
  try {
    for (const [account, version, allowed] of [
      [null, 0, false], [{ id: 'u', is_active: false }, 0, false],
      [{ id: 'u', deleted_at: '2026-01-01' }, 0, false],
      [{ id: 'u', is_active: true }, 0, true],
      [{ id: 'u', auth_version: 1 }, 0, false],
      [{ id: 'u', auth_version: 1 }, 1, true]
    ]) {
      const chain = { select() { return this }, eq() { return this }, async maybeSingle() { return { data: account, error: null } } }
      supabase.from = () => chain
      let status, advanced = false
      const res = { status(value) { status = value; return this }, json() { return this } }
      await authMiddleware({ headers: { authorization: `Bearer ${signToken({ id: 'u', authVersion: version })}` } }, res, error => {
        assert.ifError(error); advanced = true
      })
      assert.equal(advanced, allowed)
      if (!advanced) assert.equal(status, 401)
    }
  } finally { supabase.from = original }
})
