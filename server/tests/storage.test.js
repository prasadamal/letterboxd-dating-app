import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key-000000'
process.env.JWT_SECRET ||= 'test-jwt-secret-0000000000'

const { detectImageType } = await import('../services/storageService.js')

test('detectImageType recognises real image headers only', () => {
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg')
  assert.equal(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png')
  assert.equal(detectImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'binary')), 'image/webp')
  assert.equal(detectImageType(Buffer.from('<svg onload=alert(1)>')), null)
  assert.equal(detectImageType(Buffer.from('GIF89a')), null)
})
