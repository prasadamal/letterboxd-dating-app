import test from 'node:test'
import assert from 'node:assert/strict'
import { ARCHETYPES, MIN_RATED, filmPersonality, personalityBadge } from '../lib/filmPersonality.js'

// A small fake catalog keeps the baselines predictable: 10% romance, 20% Indian, 40% drama…
const baselines = {
  romantic: 0.1, thrill: 0.15, horror: 0.06, scifi: 0.1, animation: 0.1, feelgood: 0.1, action: 0.1,
  drama: 0.3, docs: 0.03, desi: 0.2, world: 0.36, canon: 0.15, gems: 0.26
}
const film = (rating, genres, extra = {}) => ({ rating, genres, origin_language: 'English', year: 2010, popularity: 70, tags: [], ...extra })
const many = (n, make) => Array.from({ length: n }, (_, i) => make(i))

test('fewer than MIN_RATED likes and dislikes is a Fresh Reel with progress', () => {
  const p = filmPersonality(many(MIN_RATED - 1, () => film('love', ['Romance'])), { baselines })
  assert.equal(p.key, 'fresh')
  assert.equal(p.ready, false)
  assert.deepEqual(p.progress, { rated: MIN_RATED - 1, needed: MIN_RATED })
  assert.equal(personalityBadge(p), null)
})

test("haven't-seen answers never count", () => {
  const rated = [...many(5, () => film('love', ['Romance'])), ...many(10, () => film('skip', ['Horror']))]
  assert.equal(filmPersonality(rated, { baselines }).key, 'fresh')
})

test('a distinctive genre beats a common one', () => {
  // 40% romance (4x the catalog) vs 60% drama (2x the catalog).
  const rated = [
    ...many(4, () => film('love', ['Romance', 'Drama'])),
    ...many(2, () => film('love', ['Drama'])),
    ...many(4, () => film('love', ['Comedy'])),
    ...many(2, () => film('hate', ['Horror']))
  ]
  const p = filmPersonality(rated, { baselines })
  assert.equal(p.key, 'romantic')
  assert.equal(p.name, ARCHETYPES.romantic.name)
  assert.ok(p.ready)
})

test('Indian languages make a Desi Cinephile; other subtitles across genres make a World Cinema Nomad', () => {
  const genres = ['Drama', 'Comedy', 'Romance', 'Thriller']
  const desi = filmPersonality(many(10, (i) => film(i < 8 ? 'love' : 'hate', [genres[i % 4]], { origin_language: i % 2 ? 'Malayalam' : 'Hindi' })), { baselines })
  assert.equal(desi.key, 'desi')
  const world = filmPersonality(
    many(12, (i) => film(i < 11 ? 'love' : 'hate', [genres[i % 4]], { origin_language: ['Korean', 'Japanese', 'French'][i % 3] })),
    { baselines }
  )
  assert.equal(world.key, 'world')
})

test('a clear genre taste wins over language, which shows as a trait', () => {
  // All thrillers, all Malayalam: the thrill signal names the personality and Indian cinema becomes a trait.
  const rated = many(10, (i) => film(i < 9 ? 'love' : 'hate', ['Thriller'], { origin_language: 'Malayalam' }))
  const p = filmPersonality(rated, { baselines })
  assert.equal(p.key, 'thrill')
  assert.ok(p.traits.includes('Desi cinema 🪔'))
})

test('a signal that is most of the catalog stays reachable', async () => {
  const { baselinesFrom } = await import('../lib/filmPersonality.js')
  const catalog = many(100, (i) => film('love', ['Drama'], { origin_language: i < 70 ? 'Tamil' : 'English' }))
  assert.equal(baselinesFrom(catalog).desi, 0.5)
})

test('a common signal needs real lift: a casual mix is a Genre Hopper', () => {
  const genres = ['Comedy', 'Horror', 'Action', 'Romance', 'Sci-Fi']
  const rated = many(12, (i) => film(i < 10 ? 'love' : 'hate', [genres[i % 5]], { origin_language: i % 3 ? 'English' : 'Korean' }))
  assert.equal(filmPersonality(rated, { baselines }).key, 'eclectic')
})

test('traits: picky or generous, a second strong signal, and film buffs', () => {
  const picky = filmPersonality([...many(3, () => film('love', ['Horror'])), ...many(7, () => film('hate', ['Comedy']))], { baselines })
  assert.equal(picky.key, 'horror')
  assert.ok(picky.traits.includes('Tough critic 🧐'))

  const buff = filmPersonality(
    many(120, (i) => film(i < 110 ? 'love' : 'hate', i % 2 ? ['Horror'] : ['Thriller'], { tags: i % 4 === 0 ? ['underseen'] : [] })),
    { baselines }
  )
  assert.ok(buff.traits.includes('Easy to please 🍿'))
  assert.ok(buff.traits.includes('Film buff 🎓'))
  assert.ok(buff.traits.length <= 3)
})

test('Science Fiction and Sci-Fi are the same genre', () => {
  const rated = many(10, (i) => film(i < 9 ? 'love' : 'hate', [i % 2 ? 'Science Fiction' : 'Sci-Fi']))
  assert.equal(filmPersonality(rated, { baselines }).key, 'scifi')
})
