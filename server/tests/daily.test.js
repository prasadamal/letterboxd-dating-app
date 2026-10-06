import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key-000000'
process.env.JWT_SECRET ||= 'test-jwt-secret-0000000000'

const { dailyNumber, likedPercent, summarizeDay } = await import('../services/dailyService.js')
const { reminderCopy } = await import('../jobs/dailyReminderJob.js')

const film = (id, myRating, likes, dislikes) => ({ id, title: `Film ${id}`, myRating, likes, dislikes, likedPercent: likedPercent(likes, dislikes) })

test('daily numbers start at #1 on 2026-10-01 and go up by one a day', () => {
  assert.equal(dailyNumber(new Date('2026-10-01T12:00:00Z')), 1)
  assert.equal(dailyNumber(new Date('2026-10-06T23:59:00Z')), 6)
})

test('summary compares you with the crowd without counting your own vote', () => {
  const films = [
    film(1, 'love', 5, 1), // others 4–1 liked: agree
    film(2, 'hate', 6, 2), // others 6–1 liked: disagree
    film(3, 'skip', 2, 2), // not seen: not compared
    film(4, 'love', 1, 0), // only you so far: not compared
    film(5, null, 0, 0) // not played yet
  ]
  const s = summarizeDay({ films, number: 6, streak: 5 })
  assert.equal(s.agreed, 1)
  assert.equal(s.comparable, 2)
  assert.equal(s.played, 4)
  assert.equal(s.complete, false)
  assert.equal(s.mostDivisive.id, 3)
  assert.equal(s.crowdFavourite.id, 1)
  assert.deepEqual(s.shareText.split('\n'), ['ReelMates Daily #6 🎬', '🟩🟥⬜🟩⬛', 'Agreed with the crowd on 1/2 · 🔥 5', 'reelmates.app'])
})

test('a finished day with no crowd yet still shares a grid', () => {
  const s = summarizeDay({ films: [film(1, 'love', 1, 0), film(2, 'skip', 0, 0)], number: 1, streak: 1 })
  assert.equal(s.complete, true)
  assert.equal(s.mostDivisive, null)
  assert.deepEqual(s.shareText.split('\n'), ['ReelMates Daily #1 🎬', '🟩⬜', 'reelmates.app'])
})

test('reminders mention a streak worth protecting', () => {
  assert.match(reminderCopy(5).title, /5-day streak/)
  assert.doesNotMatch(reminderCopy(1).title, /streak/)
})
