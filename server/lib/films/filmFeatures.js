// What the algorithms know about a film beyond its catalog row: primary genre, language group, decade,
// director and family (franchise or studio), and whether it is art-house or a blockbuster.
import fs from 'node:fs'
import { filmFacts } from '../../data/filmFacts.js'

// Director, cast, runtime, countries and IMDb id imported from Wikidata (CC0); see scripts/importWikidata.js.
const wikidata = (() => {
  try {
    return JSON.parse(fs.readFileSync(new URL('../../data/wikidataFacts.json', import.meta.url), 'utf8')).films || {}
  } catch {
    return {}
  }
})()

/** Public details for a film card: director(s), up to three cast members, runtime in minutes. */
export function filmDetails(film) {
  const w = wikidata[`${film.title}|${film.year}`]
  const director = filmFacts[`${film.title}|${film.year}`]?.d || w?.directors?.join(' & ') || null
  return { director, cast: (w?.cast || []).slice(0, 3), runtime: w?.runtime || null }
}

const INDIAN = {
  Hindi: 'Hindi',
  Malayalam: 'Malayalam',
  Tamil: 'South Indian',
  Telugu: 'South Indian',
  Kannada: 'South Indian',
  Bengali: 'Other Indian',
  Marathi: 'Other Indian'
}
const EAST_ASIA = new Set(['Japanese', 'Korean', 'Mandarin', 'Cantonese'])
const EUROPE = new Set(['French', 'Italian', 'German', 'Swedish', 'Danish', 'Norwegian', 'Russian', 'Turkish', 'Macedonian'])
const LATIN = new Set(['Spanish', 'Portuguese'])
const BLOCKBUSTER_FAMILIES = new Set([
  'Marvel', 'DC', 'Star Wars', 'The Lord of the Rings', 'Harry Potter', 'Indiana Jones', 'Avatar', 'Baahubali',
  'The Matrix', 'Mad Max', 'Dune', 'Spider-Verse', 'Godzilla', 'Alien', 'Pixar', 'Disney Animation'
])
const BIG_GENRES = new Set(['Action', 'Sci-Fi', 'Fantasy', 'Adventure'])
export const DARK_GENRES = new Set(['Horror', 'Thriller', 'Crime', 'Mystery'])
export const LIGHT_GENRES = new Set(['Comedy', 'Romance', 'Musical', 'Animation'])

export const factsKey = (film) => `${film.title}|${film.year}`

export function languageGroup(language) {
  if (!language || language === 'English') return 'English'
  if (INDIAN[language]) return 'Indian'
  if (EAST_ASIA.has(language)) return 'East Asia'
  if (EUROPE.has(language)) return 'Europe'
  if (LATIN.has(language)) return 'Latin'
  return 'Middle East & beyond'
}

export function indianGroup(language) {
  return INDIAN[language] || null
}

/** One film with everything the picker and matching need. Pure; safe to call on any catalog row. */
export function enrichFilm(film) {
  const facts = filmFacts[factsKey(film)] || {}
  const genres = Array.isArray(film.genres) ? film.genres : []
  const primaryGenre = genres[0] || 'Drama'
  const popularity = Number.isFinite(film.popularity) ? film.popularity : 55
  const tags = new Set(film.tags || [])
  const language = film.origin_language || 'English'
  const family = facts.f || null
  const arthouse =
    Boolean(facts.art) ||
    ((tags.has('canon') || tags.has('world')) && popularity <= 62 && ['Drama', 'Romance'].includes(primaryGenre))
  // Franchises and big studio animation, or a big English/Indian spectacle from 1975 on. Not indie (A24).
  const group = languageGroup(language)
  const blockbuster =
    family !== 'A24' &&
    ((family && BLOCKBUSTER_FAMILIES.has(family) && popularity >= 55) ||
      (popularity >= 78 && BIG_GENRES.has(primaryGenre) && (group === 'English' || group === 'Indian') && (film.year || 0) >= 1975))
  return {
    id: film.id,
    title: film.title,
    year: film.year,
    genres,
    primaryGenre,
    language,
    group,
    indian: indianGroup(language),
    decade: Math.floor((film.year || 2000) / 10) * 10,
    popularity,
    tags,
    director: facts.d || wikidata[factsKey(film)]?.directors?.[0] || null,
    family,
    duplicateOf: facts.dup || null,
    arthouse,
    blockbuster: Boolean(blockbuster),
    divisive: tags.has('divisive') || tags.has('debated'),
    inDeck: film.in_deck !== false
  }
}

/** Feature tokens for the taste-vector channel of matching (see lib/tasteMatch.js). */
export function featureTokens(film) {
  const f = film.primaryGenre ? film : enrichFilm(film)
  const tokens = [`g:${f.primaryGenre}`, `l:${f.group === 'Indian' ? f.indian : f.group}`, `d:${f.decade}`]
  for (const genre of f.genres.slice(1, 3)) tokens.push(`g2:${genre}`)
  if (f.director) tokens.push(`dir:${f.director}`)
  if (f.family) tokens.push(`fam:${f.family}`)
  if (f.arthouse) tokens.push('style:arthouse')
  if (f.blockbuster) tokens.push('style:blockbuster')
  tokens.push(f.popularity >= 75 ? 'pop:mainstream' : f.popularity >= 55 ? 'pop:known' : 'pop:niche')
  return tokens
}
