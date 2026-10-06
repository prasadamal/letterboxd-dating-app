import test from 'node:test'
import assert from 'node:assert/strict'
import { displayStreak, nextStreak } from '../lib/streaks.js'

test('first play starts a streak; next day extends it; a gap restarts it', () => {
  assert.deepEqual(nextStreak({}, '2026-10-05'), { current: 1, best: 1, lastDay: '2026-10-05' })
  assert.deepEqual(nextStreak({ current: 4, best: 4, lastDay: '2026-10-04' }, '2026-10-05'), { current: 5, best: 5, lastDay: '2026-10-05' })
  assert.deepEqual(nextStreak({ current: 9, best: 12, lastDay: '2026-10-01' }, '2026-10-05'), { current: 1, best: 12, lastDay: '2026-10-05' })
})

test('playing twice on the same day changes nothing', () => {
  assert.equal(nextStreak({ current: 3, best: 3, lastDay: '2026-10-05' }, '2026-10-05'), null)
})

test('streaks cross month and year boundaries', () => {
  assert.equal(nextStreak({ current: 2, best: 2, lastDay: '2026-12-31' }, '2027-01-01').current, 3)
})

test('display hides a lapsed streak but keeps the best', () => {
  assert.deepEqual(displayStreak({ current: 6, best: 8, lastDay: '2026-10-04' }, '2026-10-05'), { current: 6, best: 8, playedToday: false })
  assert.deepEqual(displayStreak({ current: 6, best: 8, lastDay: '2026-10-02' }, '2026-10-05'), { current: 0, best: 8, playedToday: false })
  assert.deepEqual(displayStreak({ current: 1, best: 8, lastDay: '2026-10-05' }, '2026-10-05'), { current: 1, best: 8, playedToday: true })
})
