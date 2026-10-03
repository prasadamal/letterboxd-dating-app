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
