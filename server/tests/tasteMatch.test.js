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

test('shared likes and shared dislikes both raise the match equally', () => {
  const me = person([1, 2], [3, 4])
  const likesOnly = compareTaste(me, person([1, 2], []))
  const dislikesOnly = compareTaste(me, person([], [3, 4]))
  assert.ok(likesOnly.score > 50)
  assert.equal(likesOnly.score, dislikesOnly.score)
  assert.deepEqual(dislikesOnly.sharedHatedTitles.sort(), ['Film 3', 'Film 4'])
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
