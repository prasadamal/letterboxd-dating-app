import assert from 'node:assert/strict'
import test from 'node:test'
import { isUniqueViolation, newFriendCode, withFreshFriendCode } from '../lib/friendCode.js'

test('friend codes are random, readable and the right shape', () => {
  const codes = new Set(Array.from({ length: 500 }, () => newFriendCode()))
  assert.equal(codes.size, 500)
  for (const code of codes) assert.match(code, /^REEL[A-HJ-KM-NP-Z2-9]{8}$/)
})

test('a friend code does not depend on the email or user id', () => {
  let n = 0
  const code = newFriendCode(() => n++ % 31)
  assert.equal(code, 'REELABCDEFGH')
})

test('isUniqueViolation recognises only unique-constraint errors', () => {
  assert.equal(isUniqueViolation({ code: '23505', message: 'duplicate key value violates unique constraint "users_referral_code_key"' }, 'referral_code'), true)
  assert.equal(isUniqueViolation({ code: '23505', message: 'duplicate key value violates unique constraint "users_email_key"' }, 'referral_code'), false)
  assert.equal(isUniqueViolation({ code: '23505', message: 'users_email_key' }), true)
  assert.equal(isUniqueViolation({ code: '23503' }), false)
  assert.equal(isUniqueViolation(null), false)
})

test('withFreshFriendCode retries on a code clash and gives up on other errors', async () => {
  const clash = Object.assign(new Error('duplicate key value violates unique constraint "users_referral_code_key"'), { code: '23505' })
  const seen = []
  const result = await withFreshFriendCode(async (code) => {
    seen.push(code)
    if (seen.length < 3) throw clash
    return code
  })
  assert.equal(seen.length, 3)
  assert.equal(result, seen[2])
  assert.equal(new Set(seen).size, 3)

  const emailTaken = Object.assign(new Error('duplicate key value violates unique constraint "users_email_key"'), { code: '23505' })
  let calls = 0
  await assert.rejects(withFreshFriendCode(async () => { calls += 1; throw emailTaken }), emailTaken)
  assert.equal(calls, 1)

  await assert.rejects(withFreshFriendCode(async () => { throw clash }, { tries: 2 }), clash)
})
