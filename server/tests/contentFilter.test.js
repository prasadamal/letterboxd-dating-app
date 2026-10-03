import test from 'node:test'
import assert from 'node:assert/strict'
import { containsBlockedContent } from '../lib/contentFilter.js'

test('content filter blocks listed terms as whole words', () => {
  assert.equal(containsBlockedContent('kill yourself'), true)
  assert.equal(containsBlockedContent('KILL   Yourself!'), true)
  assert.equal(containsBlockedContent('send nudes pls'), true)
})

test('content filter allows ordinary movie talk', () => {
  assert.equal(containsBlockedContent('Hi! Loved Grave of the Fireflies too'), false)
  assert.equal(containsBlockedContent('Skyscraper drama, grape juice, therapist'), false)
  assert.equal(containsBlockedContent(''), false)
  assert.equal(containsBlockedContent(undefined), false)
})
