import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key-000000'
process.env.JWT_SECRET ||= 'test-jwt-secret-0000000000'

const { mapPublicUser } = await import('../db.js')

test('profiles shown to other members never include private fields', () => {
  const row = {
    id: '6f1c0b0e-0000-4000-8000-000000000001',
    email: 'private@example.com',
    display_name: 'Anna',
    referral_code: 'REELABC123',
    discovery_prefs: { minAge: 25 },
    profile_completion: 80,
    verification_status: 'pending',
    verification_notes: 'id scan',
    photo_url: null
  }
  const pub = mapPublicUser(row)
  const json = JSON.stringify(pub)
  for (const secret of ['private@example.com', 'REELABC123', 'id scan']) assert.ok(!json.includes(secret), secret)
  for (const key of ['email', 'referral_code', 'discovery_prefs', 'profile_completion', 'matchmaking_enabled']) {
    assert.ok(!(key in pub), key)
  }
  assert.equal(pub.verification_status, 'unverified')
  assert.ok(!pub.avatar_url.includes('Anna'))
})
