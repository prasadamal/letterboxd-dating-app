import test from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'
const { supabase } = await import('../supabaseClient.js')
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = await import('../services/authService.js')
const { consumeAuthToken } = await import('../services/auditService.js')

test('token writes fail closed and token claims use conditional updates', async () => {
  const original = supabase.from
  try {
    const failure = new Error('database unavailable')
    supabase.from = () => ({ insert: async () => ({ error: failure }), update: () => ({ eq: async () => ({ error: failure }) }) })
    await assert.rejects(issueRefreshToken('user'), /database unavailable/)
    await assert.rejects(revokeRefreshToken('token'), /database unavailable/)
    for (const [table, column, consume] of [
      ['refresh_tokens', 'revoked_at', () => rotateRefreshToken('token')],
      ['auth_tokens', 'consumed_at', () => consumeAuthToken('token', 'password_reset')]
    ]) {
      let claimed = false
      supabase.from = name => {
        assert.equal(name, table)
        const filters = []
        const chain = {
          update(values) { assert.ok(values[column]); return this },
          eq(key, value) { filters.push([key, value]); return this },
          is(key, value) { assert.equal(key, column); assert.equal(value, null); return this },
          gt(key) { assert.equal(key, 'expires_at'); return this },
          select() { return this },
          async maybeSingle() {
            assert.ok(filters.some(([key]) => key === 'token_hash'))
            if (claimed) return { data: null, error: null }
            claimed = true
            // Returning no row exercises rejection without issuing another token.
            return { data: null, error: null }
          }
        }
        return chain
      }
      assert.equal(await consume(), null)
    }
  } finally { supabase.from = original }
})

test('suspended and deleted accounts cannot use an existing signed access token', async () => {
  const { authMiddleware, signToken } = await import('../middleware/auth.js')
  const original = supabase.from
  try {
    for (const account of [null, { id: 'u', is_active: false }, { id: 'u', deleted_at: '2026-01-01' }, { id: 'u', is_active: true }]) {
      const chain = { select() { return this }, eq() { return this }, async maybeSingle() { return { data: account, error: null } } }
      supabase.from = () => chain
      let status, advanced = false
      const res = { status(value) { status = value; return this }, json() { return this } }
      await authMiddleware({ headers: { authorization: `Bearer ${signToken({ id: 'u' })}` } }, res, error => {
        assert.ifError(error)
        advanced = true
      })
      assert.equal(advanced, Boolean(account && account.is_active && !account.deleted_at))
      if (!advanced) assert.equal(status, 401)
    }
  } finally { supabase.from = original }
})
