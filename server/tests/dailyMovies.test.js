import test from 'node:test'
import assert from 'node:assert/strict'
import { pendingDailyMovies } from '../lib/dailyMovies.js'

test('pendingDailyMovies hides films already rated today', () => {
  const movies = [
    { id: 1, title: 'A' },
    { id: 2, title: 'B' },
    { id: 3, title: 'C' }
  ]
  const pending = pendingDailyMovies(movies, new Set([2]))
  assert.deepEqual(
    pending.map((movie) => movie.id),
    [1, 3]
  )
})

test('pendingDailyMovies keeps the full batch when nothing is rated', () => {
  const movies = [{ id: 9, title: 'Z' }]
  assert.equal(pendingDailyMovies(movies, []).length, 1)
})

import { sharedDailySet, utcDayNumber } from '../lib/dailyMovies.js'

const catalog = Array.from({ length: 296 }, (_, i) => ({ id: 1000 + i }))

test('sharedDailySet gives every player the same films on the same day', () => {
  const day = utcDayNumber(new Date('2026-10-04T08:00:00Z'))
  assert.equal(day, utcDayNumber(new Date('2026-10-04T23:59:00Z')))
  // Same films regardless of the order the catalog was loaded in.
  const a = sharedDailySet(catalog, day, 10).map((m) => m.id)
  const b = sharedDailySet([...catalog].reverse(), day, 10).map((m) => m.id)
  assert.equal(a.length, 10)
  assert.deepEqual(a, b)
})

test('sharedDailySet never repeats a film within a cycle and reshuffles the next cycle', () => {
  const daysPerCycle = Math.floor(catalog.length / 10)
  const start = 29 * daysPerCycle // first day of a cycle
  const seen = new Set()
  for (let d = start; d < start + daysPerCycle; d += 1) {
    for (const movie of sharedDailySet(catalog, d, 10)) {
      assert.ok(!seen.has(movie.id), `film ${movie.id} repeated within the cycle`)
      seen.add(movie.id)
    }
  }
  assert.equal(seen.size, daysPerCycle * 10)
  const nextCycleFirstDay = sharedDailySet(catalog, start + daysPerCycle, 10).map((m) => m.id)
  assert.notDeepEqual(nextCycleFirstDay, sharedDailySet(catalog, start, 10).map((m) => m.id))
})

test('sharedDailySet handles a tiny or empty catalog', () => {
  assert.deepEqual(sharedDailySet([], 5, 10), [])
  assert.equal(sharedDailySet(catalog.slice(0, 4), 5, 10).length, 4)
})
