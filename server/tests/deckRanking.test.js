import test from 'node:test'
import assert from 'node:assert/strict'
import { betaSample, rankDeck, replyChance } from '../lib/deckRanking.js'
import { seededRandom } from '../lib/films/dailyPicker.js'

const card = (id, extra = {}) => ({ id, score: 70, alpha: 14, beta: 6, likes: 20, swipes: 40, daysSinceActive: 1, daysSinceJoined: 60, pendingLikes: 0, ...extra })

test('Beta samples average to the belief and spread with uncertainty', () => {
  const rng = seededRandom('beta')
  const draw = (a, b) => Array.from({ length: 4000 }, () => betaSample(a, b, rng))
  const sure = draw(80, 20)
  const unsure = draw(4, 1)
  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length
  const sd = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)))
  assert.ok(Math.abs(mean(sure) - 0.8) < 0.02)
  assert.ok(Math.abs(mean(unsure) - 0.8) < 0.03)
  assert.ok(sd(unsure) > 2 * sd(sure))
})

test('a proven strong match beats a proven weak one', () => {
  const ranked = rankDeck([card('weak', { score: 45, alpha: 45, beta: 55 }), card('strong', { score: 85, alpha: 85, beta: 15 })], 'viewer:day')
  assert.equal(ranked[0].id, 'strong')
})

test('someone who already liked you moves up; very selective people move down', () => {
  assert.equal(replyChance({ likedYou: true }), 1)
  assert.ok(replyChance({ likes: 2, swipes: 100 }) < replyChance({ likes: 50, swipes: 100 }))
  const sure = { alpha: 140, beta: 60 } // well-established scores, so only the like decides
  const ranked = rankDeck([card('a', sure), card('b', { ...sure, likedYou: true })], 'viewer:day')
  assert.equal(ranked[0].id, 'b')
})

test('the deck is the same all day and changes the next day', () => {
  const cards = Array.from({ length: 30 }, (_, i) => card(`c${i}`, { alpha: 3 + (i % 5), beta: 2 + (i % 3) }))
  const order = (seed) => rankDeck(cards, seed).map((c) => c.id).join(',')
  assert.equal(order('me:2026-11-21'), order('me:2026-11-21'))
  assert.notEqual(order('me:2026-11-21'), order('me:2026-11-22'))
})

test('unproven but promising people get real exposure (exploration), proven ones still lead on average', () => {
  const proven = card('proven', { alpha: 72, beta: 28 }) // 72%, lots of evidence
  const promising = card('promising', { alpha: 3.5, beta: 1.5 }) // 70%, little evidence
  let promisingFirst = 0
  for (let d = 0; d < 400; d += 1) if (rankDeck([proven, promising], `me:${d}`)[0].id === 'promising') promisingFirst += 1
  assert.ok(promisingFirst > 80 && promisingFirst < 240, `promising first on ${promisingFirst}/400 days`)
})

test('people flooded with likes, inactive for weeks, are shown less; newcomers get a small lift', () => {
  const ranked = rankDeck([card('flooded', { pendingLikes: 60, daysSinceActive: 30 }), card('normal')], 'v')
  assert.equal(ranked[0].id, 'normal')
  const lift = rankDeck([card('old', { alpha: 70, beta: 30 }), card('new', { alpha: 70, beta: 30, daysSinceJoined: 2 })], 'v')
  assert.ok(lift.find((c) => c.id === 'new').rankValue > 0)
})
