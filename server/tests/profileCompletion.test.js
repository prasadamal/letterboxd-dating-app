import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key-000000'
process.env.JWT_SECRET ||= 'test-jwt-secret-0000000000'

const { computeProfileCompletion } = await import('../services/auditService.js')

test('a name, photo and country are enough for dating (80)', () => {
  assert.equal(computeProfileCompletion({ display_name: 'A', photo_url: 'x', country: 'India' }), 80)
})

test('no photo never reaches 80', () => {
  assert.equal(computeProfileCompletion({ display_name: 'A', country: 'India', bio: 'hi', email_verified_at: 'now' }), 60)
})

test('a bio or a prompt and a verified email complete the profile', () => {
  const base = { display_name: 'A', photo_url: 'x', country: 'India', email_verified_at: 'now' }
  assert.equal(computeProfileCompletion({ ...base, bio: 'Subtitles on' }), 100)
  assert.equal(computeProfileCompletion({ ...base, prompts: [{ key: 'comfort', answer: 'Up' }] }), 100)
})
