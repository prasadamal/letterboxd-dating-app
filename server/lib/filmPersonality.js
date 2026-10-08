// Film personality: a shareable identity built from what someone liked, compared with the catalog as a whole.
//
// Each signal (romance, thrillers, Indian cinema, hidden gems…) gets a score of share² / baseline, where
// share = the fraction of your liked films that match it and baseline = the fraction of the catalog that does.
// That rewards both how much of your taste it is and how unusual that is: liking a lot of romance (7% of the
// catalog) says more than liking a lot of drama (30%). The best signal with at least MIN_SHARE of your likes and
// MIN_LIFT times its catalog share wins; nothing → Genre Hopper.

import { movieCatalog } from '../movieCatalog.js'
import { canonicalGenres, INDIAN_LANGUAGES } from './genres.js'

export const MIN_RATED = 8 // likes + dislikes before a personality is revealed
const MIN_SHARE = 0.3
const MIN_LIFT = 1.5
const SECONDARY_SHARE = 0.25
const SECONDARY_LIFT = 1.3
const BASELINE_CAP = 0.5
// What you watch says more than where it's from or how famous it is: a qualifying genre signal wins over these.
const BROAD_SIGNALS = new Set(['desi', 'world', 'canon', 'gems'])

export const ARCHETYPES = {
  fresh: { name: 'Fresh Reel', emoji: '🎞️', tagline: 'Swipe a few more films to reveal your film personality.', colors: ['#3A3A48', '#6E6E86'] },
  romantic: { name: 'Hopeless Romantic', emoji: '💘', tagline: 'Here for the yearning, the rain and the airport sprint.', colors: ['#FF4F9A', '#FF9A6B'] },
  thrill: { name: 'Midnight Thrill-Seeker', emoji: '🔪', tagline: 'Twists, tension and a body count. Lights off, obviously.', colors: ['#1F2A44', '#E63946'] },
  horror: { name: 'Fright Night Regular', emoji: '👻', tagline: 'If nobody screamed, was it even a movie night?', colors: ['#2A0A0A', '#C1121F'] },
  scifi: { name: 'Sci-Fi Dreamer', emoji: '🚀', tagline: 'Space, time and other worlds. Reality is overrated.', colors: ['#0F2A4A', '#4BE1FF'] },
  animation: { name: 'Animation Devotee', emoji: '✨', tagline: 'Hand-drawn or pixel-perfect, animation is cinema.', colors: ['#06D6A0', '#B8F03A'] },
  feelgood: { name: 'Feel-Good Fanatic', emoji: '🌈', tagline: 'Comfort films, happy endings and songs you hum for days.', colors: ['#FFB627', '#FF6B3D'] },
  action: { name: 'Blockbuster Believer', emoji: '💥', tagline: 'Big screen, big sound, bigger popcorn.', colors: ['#FF5A1F', '#7B2CBF'] },
  drama: { name: 'Drama Devotee', emoji: '🎭', tagline: 'Big feelings, bigger performances. Tissues within reach.', colors: ['#2B2D7C', '#8F6BFF'] },
  docs: { name: 'Truth Seeker', emoji: '🎥', tagline: 'Real stories hit harder than anything a writers’ room could invent.', colors: ['#3D405B', '#81B29A'] },
  desi: { name: 'Desi Cinephile', emoji: '🪔', tagline: 'From Malayalam gems to Hindi classics, home-grown cinema hits different.', colors: ['#FF8A3D', '#B5179E'] },
  world: { name: 'World Cinema Nomad', emoji: '🌏', tagline: 'Subtitles are a feature, not a bug.', colors: ['#0B6E4F', '#3DB2FF'] },
  canon: { name: 'Canon Keeper', emoji: '🏛️', tagline: 'The classics are classics for a reason, and you did the homework.', colors: ['#7F4F24', '#E9C46A'] },
  gems: { name: 'Hidden Gem Hunter', emoji: '💎', tagline: 'You were into it before it was cool. Probably still are.', colors: ['#3A0CA3', '#4CC9F0'] },
  eclectic: { name: 'Genre Hopper', emoji: '🎲', tagline: 'Horror on Monday, rom-com on Tuesday. No notes.', colors: ['#8F6BFF', '#FF4F9A'] }
}

// Short labels for a second strong signal, shown as trait chips.
const TRAIT_LABELS = {
  romantic: 'Romance at heart 💘',
  thrill: 'Thriller fan 🔪',
  horror: 'Horror fan 👻',
  scifi: 'Sci-fi head 🚀',
  animation: 'Animation lover ✨',
  feelgood: 'Comfort watcher 🌈',
  action: 'Action fan 💥',
  drama: 'Drama lover 🎭',
  docs: 'Doc nerd 🎥',
  desi: 'Desi cinema 🪔',
  world: 'Subtitles on 🌏',
  canon: 'Classic soul 📼',
  gems: 'Niche taste 💎'
}

const has = (film, genre) => film.genreSet.has(genre)

const SIGNALS = [
  ['romantic', (f) => has(f, 'Romance')],
  ['thrill', (f) => has(f, 'Thriller') || has(f, 'Crime') || has(f, 'Mystery')],
  ['horror', (f) => has(f, 'Horror')],
  ['scifi', (f) => has(f, 'Sci-Fi') || has(f, 'Fantasy')],
  ['animation', (f) => has(f, 'Animation')],
  ['feelgood', (f) => has(f, 'Comedy') || has(f, 'Musical') || has(f, 'Family')],
  ['action', (f) => has(f, 'Action') || has(f, 'Adventure') || has(f, 'War') || has(f, 'Western')],
  ['drama', (f) => has(f, 'Drama')],
  ['docs', (f) => has(f, 'Documentary')],
  ['desi', (f) => INDIAN_LANGUAGES.has(f.origin_language)],
  ['world', (f) => Boolean(f.origin_language) && f.origin_language !== 'English' && !INDIAN_LANGUAGES.has(f.origin_language)],
  ['canon', (f) => f.tags.includes('canon') || (Number.isFinite(f.year) && f.year < 1975)],
  ['gems', (f) => f.tags.includes('underseen') || (Number.isFinite(f.popularity) && f.popularity <= 45)]
]

function prepare(film) {
  return {
    ...film,
    genreSet: new Set(canonicalGenres(film.genres)),
    tags: film.tags || [],
    year: Number(film.year),
    popularity: Number(film.popularity)
  }
}

function shares(films) {
  const out = {}
  for (const [key, test] of SIGNALS) out[key] = films.length ? films.filter(test).length / films.length : 0
  return out
}

let catalogBaselines = null
export function baselinesFrom(films) {
  const raw = shares(films.map(prepare))
  // A floor keeps a signal the catalog barely has (e.g. documentaries) from exploding the score. A ceiling keeps a
  // signal that is most of the catalog (Indian films are two thirds of it) reachable at all: with a 0.66 baseline
  // the 1.5× lift would need 99% of your likes.
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Math.min(Math.max(value, 0.03), BASELINE_CAP)]))
}

function defaultBaselines() {
  catalogBaselines ??= baselinesFrom(movieCatalog)
  return catalogBaselines
}

function archetype(key, extra = {}) {
  return { key, ...ARCHETYPES[key], ...extra }
}

// `rated`: [{ rating: 'love' | 'hate' | 'skip', genres, origin_language, year, popularity, tags }]
export function filmPersonality(rated, { baselines = defaultBaselines() } = {}) {
  const films = (rated || []).filter((f) => f && (f.rating === 'love' || f.rating === 'hate')).map(prepare)
  const liked = films.filter((f) => f.rating === 'love')
  if (films.length < MIN_RATED || !liked.length) {
    return archetype('fresh', { ready: false, traits: [], progress: { rated: films.length, needed: MIN_RATED } })
  }

  const likedShares = shares(liked)
  const ranked = SIGNALS.map(([key]) => {
    const share = likedShares[key]
    return { key, share, lift: share / baselines[key], score: share ** 2 / baselines[key] }
  })
    .filter((s) => s.share >= SECONDARY_SHARE && s.lift >= SECONDARY_LIFT)
    .sort((a, b) => b.score - a.score)

  const qualifies = (s) => s.share >= MIN_SHARE && s.lift >= MIN_LIFT
  const primary = ranked.find((s) => qualifies(s) && !BROAD_SIGNALS.has(s.key)) || ranked.find(qualifies)
  const key = primary ? primary.key : 'eclectic'

  const traits = []
  const likeRate = liked.length / films.length
  if (likeRate >= 0.8) traits.push('Easy to please 🍿')
  else if (likeRate <= 0.4) traits.push('Tough critic 🧐')
  const secondary = ranked.find((s) => s.key !== key)
  if (secondary) traits.push(TRAIT_LABELS[secondary.key])
  if (films.length >= 100) traits.push('Film buff 🎓')

  return archetype(key, { ready: true, traits: traits.slice(0, 3) })
}

// Compact form for profile cards in lists.
export function personalityBadge(personality) {
  if (!personality?.ready) return null
  return { key: personality.key, name: personality.name, emoji: personality.emoji, colors: personality.colors }
}
