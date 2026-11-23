import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldCountSwipe, shouldNotifyMatch, swipeKind } from '../lib/swipeIdempotency.js'

test('a repeated decision is recognised', () => {
  assert.equal(swipeKind(null, 'like'), 'new')
  assert.equal(swipeKind(undefined, 'pass'), 'new')
  assert.equal(swipeKind('like', 'like'), 'repeat')
  assert.equal(swipeKind('pass', 'like'), 'change')
})

test('repeats never move counters', () => {
  assert.equal(shouldCountSwipe('new'), true)
  assert.equal(shouldCountSwipe('change'), true)
  assert.equal(shouldCountSwipe('repeat'), false)
})

test('match notifications fire once, from the request that created the match', () => {
  assert.equal(shouldNotifyMatch({ matched: true, created: true }), true)
  assert.equal(shouldNotifyMatch({ matched: true, created: false }), false, 'double tap on a like that already matched')
  assert.equal(shouldNotifyMatch({ matched: false, created: false }), false)
})
