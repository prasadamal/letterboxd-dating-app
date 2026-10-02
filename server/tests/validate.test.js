import test from 'node:test'
import assert from 'node:assert/strict'
import { signupSchema, loginSchema, swipeSchema } from '../middleware/validate.js'

test('signup schema rejects weak password', () => {
  const result = signupSchema.safeParse({
    email: 'a@b.com',
    password: 'short',
    name: 'Maya',
    age: 25,
    country: 'India',
    gender: 'female',
    termsAccepted: true
  })
  assert.equal(result.success, false)
})

test('signup schema accepts valid payload', () => {
  const result = signupSchema.safeParse({
    email: 'maya@example.com',
    password: '12345678',
    name: 'Maya',
    age: 25,
    country: 'India',
    gender: 'female',
    termsAccepted: true
  })
  assert.equal(result.success, true)
})

test('login schema requires email', () => {
  const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' })
  assert.equal(result.success, false)
})

test('swipe schema validates action', () => {
  const result = swipeSchema.safeParse({
    targetId: '00000000-0000-4000-8000-000000000001',
    action: 'like'
  })
  assert.equal(result.success, true)
})
