import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key-000000'
process.env.JWT_SECRET ||= 'test-jwt-secret-0000000000'

const { peopleScore, rankChart } = await import('../services/filmService.js')
const { watchTogetherPicks } = await import('../services/friendsService.js')

const film = (id, likes, dislikes, popularity = 50) => ({
  id,
  likes,
  dislikes,
  votes: likes + dislikes,
  popularity,
  score: peopleScore(likes, dislikes)
})

test('people score starts neutral and needs several votes to reach the top', () => {
  assert.equal(peopleScore(0, 0), 0.5)
  assert.ok(peopleScore(1, 0) < peopleScore(20, 2))
  assert.ok(peopleScore(0, 5) < 0.5)
})

test('chart ranks voted films by people score, then unvoted films by popularity', () => {
  const chart = rankChart([film(1, 1, 0), film(2, 30, 3), film(3, 0, 0, 90), film(4, 2, 8), film(5, 0, 0, 40)])
  assert.deepEqual(chart.map((f) => f.id), [2, 1, 4, 3, 5])
  assert.deepEqual(chart.map((f) => f.rank), [1, 2, 3, null, null])
})

test('watch-together picks are films one person loved that the other has not rated, rarest first', () => {
  const from = {
    love: new Set([1, 2, 3, 4]),
    titles: new Map([[1, 'Famous'], [2, 'Rare'], [3, 'Seen'], [4, 'Middling']]),
    popularity: new Map([[1, 90], [2, 35], [3, 50], [4, 60]])
  }
  const to = { love: new Set([3]), hate: new Set() }
  assert.deepEqual(watchTogetherPicks(from, to), ['Rare', 'Middling', 'Famous'])
  assert.deepEqual(watchTogetherPicks(from, to, 1), ['Rare'])
  assert.deepEqual(watchTogetherPicks(null, to), [])
})
