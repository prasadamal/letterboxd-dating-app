import test from 'node:test'
import assert from 'node:assert/strict'
import { compareTaste, rankByTaste, rarityWeight } from '../lib/tasteMatch.js'

const person = (love, hate, popularity = {}) => ({
  love: new Set(love),
  hate: new Set(hate),
  titles: new Map([...love, ...hate].map((id) => [id, `Film ${id}`])),
  popularity: new Map(Object.entries(popularity).map(([id, p]) => [Number(id), p]))
})

test('no films in common means no opinion (50%)', () => {
  assert.equal(compareTaste(person([1, 2], [3]), person([4], [5])).score, 50)
  assert.equal(compareTaste(null, person([1], [])).score, 50)
})

test('shared likes and shared dislikes both raise the match; a shared dislike of a well-liked film counts more', () => {
  const me = person([1, 2], [3, 4])
  const likesOnly = compareTaste(me, person([1, 2], []))
  const dislikesOnly = compareTaste(me, person([], [3, 4]))
  assert.ok(likesOnly.score > 50)
  assert.ok(dislikesOnly.score > likesOnly.score) // most films are liked, so disliking one together is rarer
  assert.deepEqual(dislikesOnly.sharedHatedTitles.sort(), ['Film 3', 'Film 4'])
})

test('agreement is weighted by surprise: everyone loves it → little; it splits people → a lot', () => {
  const odds = new Map([[1, { pSeen: 0.95, pLove: 0.95 }], [2, { pSeen: 0.95, pLove: 0.5 }]])
  const me = person([1, 2], [])
  const onFavourite = compareTaste(me, person([1], []), { odds })
  const onDivisive = compareTaste(me, person([2], []), { odds })
  assert.ok(onDivisive.score > onFavourite.score)
  // Disagreeing about a film nearly everyone loves says more than disagreeing about a divisive one.
  const vsFavourite = compareTaste(person([1], []), person([], [1]), { odds })
  const vsDivisive = compareTaste(person([2], []), person([], [2]), { odds })
  assert.ok(vsFavourite.score < vsDivisive.score)
})

test('diary stars shade agreement: 8 and 9 is closer than 8 and 3', () => {
  const withStars = (love, hate, stars) => ({ ...person(love, hate), stars: new Map(Object.entries(stars).map(([k, v]) => [Number(k), v])) })
  const me = withStars([1, 2, 3], [], { 1: 8, 2: 8, 3: 8 })
  const close = compareTaste(me, withStars([1, 2, 3], [], { 1: 9, 2: 9, 3: 8 }))
  const far = compareTaste(me, withStars([1, 2, 3], [], { 1: 6, 2: 5, 3: 6 }))
  assert.ok(close.score > far.score)
})

test('both not having seen the same well-known films is a small bond; the confidence grows with evidence', () => {
  const pop = { 1: 88, 2: 86 }
  const a = { ...person([], [], pop), skip: new Set([1, 2]) }
  const b = { ...person([], [], pop), skip: new Set([1, 2]) }
  const r = compareTaste(a, b)
  assert.ok(r.score > 50)
  assert.equal(r.sharedUnseen.length, 2)
  assert.equal(r.confidence, 'low')
  const many = compareTaste(person([1, 2, 3, 4, 5, 6, 7, 8], [9, 10, 11, 12]), person([1, 2, 3, 4, 5, 6, 7, 8], [9, 10, 11, 12]))
  assert.equal(many.confidence, 'high')
  assert.ok(many.low < many.score && many.low > 50)
})

test('a taste profile matches people who share no films yet (a Ghibli fan and a Shinkai fan)', () => {
  const film = (id, title, year, genres, language, popularity) => [id, { id, title, year, genres, origin_language: language, popularity }]
  const films = new Map([
    film(1, 'Spirited Away', 2001, ['Animation'], 'Japanese', 86), film(2, 'My Neighbor Totoro', 1988, ['Animation'], 'Japanese', 55),
    film(3, "Howl's Moving Castle", 2004, ['Animation'], 'Japanese', 76), film(4, 'Your Name', 2016, ['Animation'], 'Japanese', 83),
    film(5, 'Weathering with You', 2019, ['Animation'], 'Japanese', 48), film(6, 'Suzume', 2022, ['Animation'], 'Japanese', 47),
    film(7, 'The Avengers', 2012, ['Action'], 'English', 86), film(8, 'The Dark Knight', 2008, ['Action'], 'English', 89),
    film(9, 'Black Panther', 2018, ['Action'], 'English', 83)
  ])
  const who = (love) => ({ ...person(love, []), films })
  const ghibli = who([1, 2, 3])
  const shinkai = who([4, 5, 6])
  const marvel = who([7, 8, 9])
  const near = compareTaste(ghibli, shinkai)
  const far = compareTaste(ghibli, marvel)
  assert.equal(near.sharedCount, 0)
  assert.ok(near.score > far.score, `${near.score} vs ${far.score}`)
  assert.ok(near.reasons.some((r) => /Japanese|animation/i.test(r)), near.reasons.join('; '))
})

test('one liked what the other disliked lowers the match', () => {
  const r = compareTaste(person([1, 2, 3], []), person([], [1, 2, 3]))
  assert.ok(r.score < 50)
  assert.equal(r.conflicts, 3)
})

test('more shared films beats one lucky overlap', () => {
  const me = person([1, 2, 3, 4, 5, 6], [7, 8, 9, 10])
  const lucky = compareTaste(me, person([1], []))
  const real = compareTaste(me, person([1, 2, 3, 4, 5], [7, 8, 9]))
  assert.ok(real.score > lucky.score)
  assert.equal(real.sharedCount, 8)
})

test('agreeing on an obscure film counts more than on a blockbuster, and is listed first', () => {
  const pop = { 1: 90, 2: 35 }
  const me = person([1, 2], [], pop)
  assert.ok(compareTaste(me, person([2], [], pop)).score > compareTaste(me, person([1], [], pop)).score)
  assert.deepEqual(compareTaste(me, person([1, 2], [], pop)).sharedLovedTitles, ['Film 2', 'Film 1'])
  assert.equal(rarityWeight(90), 1)
  assert.equal(rarityWeight(35), 2)
})

test('ranking: match % first, then films in common', () => {
  const cards = [
    { id: 'a', score: 70, sharedCount: 9 },
    { id: 'b', score: 80, sharedCount: 2 },
    { id: 'c', score: 70, sharedCount: 12 }
  ].sort(rankByTaste)
  assert.deepEqual(cards.map((c) => c.id), ['b', 'c', 'a'])
})

test('the same all-time favourite raises the match and is reported as "same"', () => {
  const me = { ...person([1], []), favorite: 9 }
  const plain = compareTaste(me, person([1], []))
  const r = compareTaste(me, { ...person([1], []), favorite: 9 })
  assert.equal(r.favorite.relation, 'same')
  assert.ok(r.score > plain.score)
})

test('liking or disliking the other person\'s favourite moves the match', () => {
  const them = { ...person([1], []), favorite: 7 }
  const liked = compareTaste(person([1, 7], []), them)
  const disliked = compareTaste(person([1], [7]), them)
  const unrated = compareTaste(person([1], []), them)
  assert.equal(liked.favorite.relation, 'you_liked')
  assert.equal(disliked.favorite.relation, 'you_disliked')
  assert.equal(unrated.favorite.relation, 'not_rated')
  assert.ok(liked.score > unrated.score)
  assert.ok(disliked.score < unrated.score)
})
