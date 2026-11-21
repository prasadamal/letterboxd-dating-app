// The daily ten: the same ten films for everyone each day, each from a different corner of cinema.
//
// Every day has ten slots (crowd favourite, hidden gem, new, Indian, world, director's pick, dark,
// feel-good, blockbuster, art house). One day a week the director and blockbuster slots become a
// face-off pair (Marvel vs DC, Nolan vs Villeneuve…). Slots are filled most-constrained first; each
// candidate is scored on how well it fits the slot, how much its answers tell us about people (films
// that split opinion), how likely a film fan is to have seen it, and how different it is from the
// films already chosen. Hard rules: no two films by one director or from one franchise or studio, at
// most five English films, only the hidden gem may be a film most people haven't seen, and a film
// rests for weeks before it comes back. The result depends only on the day, the catalog, the
// community's answers and what was shown before, so every player gets the same ten.
import { FACE_OFFS, SIGNATURE_DIRECTORS } from '../../data/filmFacts.js'
import { DARK_GENRES, LIGHT_GENRES } from './filmFeatures.js'
import { informativeness } from './filmStats.js'

export const DAILY_COUNT = 10
const FILM_REST_DAYS = 40 // a film is not shown again for this long (relaxed only if a slot runs dry)
const FILM_SOFT_REST_DAYS = 120 // after that it still prefers films not seen for longer
const DIRECTOR_REST_DAYS = 14 // the director's pick rotates
const MAX_ENGLISH = 5
const FAMILIAR = 0.45 // most slots want films at least this likely to be seen (the gem has no floor)
const GEM_MAX_SEEN = 0.38
const FACE_OFF_WEEKDAY = 3 // day number modulo 7

const INDIAN_ROTATION = ['Malayalam', 'Hindi', 'South Indian', 'Malayalam', 'Hindi', 'Other Indian', 'Malayalam']
const WORLD_ROTATION = ['East Asia', 'Europe', 'East Asia', 'Latin', 'Europe', 'Middle East & beyond', 'East Asia']

// Deterministic pseudo-random numbers for one seed (mulberry32 over an FNV hash).
export function seededRandom(seedText) {
  let h = 2166136261
  for (let i = 0; i < seedText.length; i += 1) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ANY = () => true

const matchesSide = (film, side) =>
  (side.family && film.family === side.family) || (side.director && film.director === side.director)

function slotDefinitions(ctx) {
  const { latestYear, indianToday, worldToday, directorToday, faceOff } = ctx
  const isNew = (f) => f.year >= latestYear - 4
  const slots = {
    crowd: {
      label: 'Crowd favourite',
      note: 'Most film fans have seen this one.',
      match: (f, o) => f.popularity >= 74 && o.pLove >= 0.6,
      fit: (f, o) => (f.popularity - 74) / 16 + o.pLove
    },
    gem: {
      label: 'Hidden gem',
      note: "Most people haven't seen this one. Tap Haven't seen if you haven't.",
      familiarity: false,
      match: (f, o) =>
        o.pSeen <= GEM_MAX_SEEN &&
        f.popularity <= 52 &&
        (f.arthouse || ['canon', 'world', 'underseen', 'indian', 'malayalam'].some((t) => f.tags.has(t))),
      fit: (f, o) => (1 - o.pSeen) * 0.6 + o.pLove * 0.8
    },
    fresh: {
      label: 'New-ish',
      note: 'One of the newer films.',
      match: (f) => isNew(f),
      fit: (f) => (f.year - (latestYear - 4)) / 4
    },
    indian: {
      label: 'Indian cinema',
      labelFor: (f) => (f.indian && f.indian !== 'Other Indian' ? `${f.indian} cinema` : `${f.language} cinema`),
      familiarity: 0.3,
      match: (f) => f.indian === indianToday,
      loose: (f) => Boolean(f.indian),
      fit: (f, o) => o.pSeen
    },
    world: {
      label: 'World cinema',
      labelFor: (f) => `World cinema: ${f.language}`,
      match: (f) => f.group === worldToday,
      loose: (f) => f.group !== 'English' && f.group !== 'Indian',
      fit: (f, o) => o.pSeen
    },
    auteur: {
      label: "Director's pick",
      labelFor: (f) => `Director's pick: ${f.director}`,
      match: (f) => Boolean(directorToday) && f.director === directorToday,
      loose: (f) => Boolean(f.director) && SIGNATURE_DIRECTORS.includes(f.director),
      fit: (f, o) => o.pSeen
    },
    dark: {
      label: 'Dark side',
      match: (f) => DARK_GENRES.has(f.primaryGenre),
      fit: (f) => (f.primaryGenre === 'Horror' ? 1 : 0.7)
    },
    light: {
      label: 'Feel-good',
      match: (f) => LIGHT_GENRES.has(f.primaryGenre),
      fit: (f) => (f.primaryGenre === 'Comedy' || f.primaryGenre === 'Romance' ? 1 : 0.8)
    },
    big: {
      label: 'Blockbuster',
      match: (f) => f.blockbuster,
      fit: (f) => f.popularity / 90
    },
    art: {
      label: 'Art house',
      labelFor: (f) => (f.arthouse ? 'Art house' : 'Divisive'),
      noteFor: (f) => (f.arthouse ? 'Slow, strange or bold: the festival kind.' : 'The kind that splits a room.'),
      familiarity: 0.35,
      match: (f) => f.arthouse,
      loose: (f) => f.arthouse || f.divisive,
      fit: (f) => (f.arthouse ? 1.2 : 0.5)
    }
  }
  if (faceOff) {
    for (const [key, side] of [['faceA', faceOff.a], ['faceB', faceOff.b]]) {
      slots[key] = {
        label: `Face-off: ${faceOff.title}`,
        faceOff: faceOff.title,
        strict: true, // never falls back to unrelated films; the day becomes a normal day instead
        match: (f) => matchesSide(f, side),
        fit: (f, o) => o.pSeen
      }
    }
  }
  return slots
}

function fillOrder(faceOff) {
  return faceOff
    ? ['faceA', 'faceB', 'gem', 'indian', 'world', 'fresh', 'art', 'dark', 'light', 'crowd']
    : ['auteur', 'gem', 'indian', 'world', 'fresh', 'big', 'art', 'dark', 'light', 'crowd']
}

// The order players see: an easy start, light and dark alternating, the hidden gem last.
function showOrder(faceOff) {
  return faceOff
    ? ['crowd', 'fresh', 'dark', 'indian', 'faceA', 'faceB', 'world', 'light', 'art', 'gem']
    : ['crowd', 'fresh', 'dark', 'indian', 'auteur', 'world', 'light', 'big', 'art', 'gem']
}

/** Days since each film / director was last shown, from history = [{ dayNumber, ids }]. */
function lastShown(history, filmsById, dayNumber) {
  const filmAgo = new Map()
  const directorAgo = new Map()
  for (const entry of history || []) {
    const ago = dayNumber - entry.dayNumber
    if (ago <= 0) continue
    for (const id of entry.ids || []) {
      if (!filmAgo.has(id) || ago < filmAgo.get(id)) filmAgo.set(id, ago)
      const director = filmsById.get(id)?.director
      if (director && (!directorAgo.has(director) || ago < directorAgo.get(director))) directorAgo.set(director, ago)
    }
  }
  return { filmAgo, directorAgo }
}

function chooseDirector(films, odds, dayNumber, directorAgo, filmAgo, rng) {
  const ready = (f) => !f.duplicateOf && (filmAgo.get(f.id) ?? Infinity) > FILM_REST_DAYS && (odds.get(f.id)?.pSeen ?? 0) >= FAMILIAR
  const candidates = SIGNATURE_DIRECTORS.filter(
    (d) => (directorAgo.get(d) ?? Infinity) > DIRECTOR_REST_DAYS && films.some((f) => f.director === d && ready(f))
  )
  if (!candidates.length) return null
  // Longest-rested first, with a seeded shuffle among equals so the order isn't alphabetical.
  const keyed = candidates.map((d) => ({ d, rest: Math.min(directorAgo.get(d) ?? 999, 999), r: rng() }))
  keyed.sort((x, y) => y.rest - x.rest || x.r - y.r)
  return keyed[0].d
}

function chooseFaceOff(films, odds, dayNumber, filmAgo) {
  if (((dayNumber % 7) + 7) % 7 !== FACE_OFF_WEEKDAY) return null
  const week = Math.floor(dayNumber / 7)
  const ok = (side) =>
    films.some(
      (f) => matchesSide(f, side) && !f.duplicateOf && (filmAgo.get(f.id) ?? Infinity) > 21 && (odds.get(f.id)?.pSeen ?? 0) >= FAMILIAR
    )
  for (let i = 0; i < FACE_OFFS.length; i += 1) {
    const candidate = FACE_OFFS[(week + i) % FACE_OFFS.length]
    if (ok(candidate.a) && ok(candidate.b)) return candidate
  }
  return null
}

/**
 * Pick the daily ten.
 * @param {object} p
 * @param {Array} p.films        enriched films (lib/films/filmFeatures.js#enrichFilm), in_deck only
 * @param {Map}   p.odds         Map<id, {pSeen, pLove}> from lib/films/filmStats.js
 * @param {number} p.dayNumber   UTC day number (days since 1970-01-01)
 * @param {Array} [p.history]    [{ dayNumber, ids }] of earlier daily sets (any order)
 * @returns {{ films: Array<{id, slot, label, note?, faceOff?}>, faceOff: string|null }}
 */
export function pickDailySet({ films, odds, dayNumber, history = [], count = DAILY_COUNT }) {
  // Sorted so the result never depends on the order the catalog arrives in.
  const pool = films.filter((f) => f.inDeck !== false && !f.duplicateOf).sort((a, b) => a.id - b.id)
  if (!pool.length) return { films: [], faceOff: null }
  const filmsById = new Map(pool.map((f) => [f.id, f]))
  const rng = seededRandom(`reelmates-daily-v2:${dayNumber}`)
  const { filmAgo, directorAgo } = lastShown(history, filmsById, dayNumber)
  const latestYear = Math.max(...pool.map((f) => f.year || 0))
  const faceOff = chooseFaceOff(pool, odds, dayNumber, filmAgo)
  const ctx = {
    latestYear,
    indianToday: INDIAN_ROTATION[((dayNumber % 7) + 7) % 7],
    worldToday: WORLD_ROTATION[((Math.floor(dayNumber / 7) + dayNumber) % 7 + 7) % 7],
    directorToday: faceOff ? null : chooseDirector(pool, odds, dayNumber, directorAgo, filmAgo, rng),
    faceOff
  }
  const slots = slotDefinitions(ctx)
  const noise = new Map(pool.map((f) => [f.id, rng()]))
  const chosen = []
  const oddsOf = (f) => odds.get(f.id) || { pSeen: 0.5, pLove: 0.7 }

  const allowed = (f, slot, rest) => {
    if (chosen.some((c) => c.film.id === f.id)) return false
    if ((filmAgo.get(f.id) ?? Infinity) <= rest) return false
    if (f.director && chosen.some((c) => c.film.director === f.director)) return false
    if (f.family && chosen.some((c) => c.film.family === f.family)) return false
    if (f.group === 'English' && chosen.filter((c) => c.film.group === 'English').length >= MAX_ENGLISH) return false
    if (slot.familiarity === false) return true
    return oddsOf(f).pSeen >= (slot.familiarity ?? FAMILIAR)
  }

  const score = (f, slot) => {
    const o = oddsOf(f)
    const info = informativeness(o).opinion // 0 … 1 bits
    let s = 1.0 * slot.fit(f, o) + 0.9 * info + (slot.familiarity === false ? 0 : 0.35 * o.pSeen) + 0.3 * noise.get(f.id)
    if (chosen.some((c) => c.film.primaryGenre === f.primaryGenre)) s -= 0.6
    if (f.group !== 'English' && chosen.some((c) => c.film.language === f.language)) s -= 0.35
    if (chosen.some((c) => c.film.decade === f.decade)) s -= 0.2
    const ago = filmAgo.get(f.id)
    if (ago != null && ago <= FILM_SOFT_REST_DAYS) s -= 0.5 * (1 - ago / FILM_SOFT_REST_DAYS)
    return s
  }

  // Each slot: strict match first, then the slot's looser match, then relax resting, then anything.
  const fill = (key) => {
    const slot = slots[key]
    if (!slot) return false
    const attempts = slot.strict
      ? [[slot.match, FILM_REST_DAYS], [slot.match, 21]]
      : [
          [slot.match, FILM_REST_DAYS],
          [slot.loose || slot.match, FILM_REST_DAYS],
          [slot.loose || slot.match, 14],
          [ANY, 14],
          [ANY, 0]
        ]
    let best = null
    for (const [predicate, rest] of attempts) {
      for (const f of pool) {
        if (!predicate(f, oddsOf(f)) || !allowed(f, slot, rest)) continue
        const s = score(f, slot)
        if (!best || s > best.s) best = { film: f, s, wildcard: predicate === ANY }
      }
      if (best) break
    }
    if (best) chosen.push({ key, film: best.film, wildcard: best.wildcard })
    return Boolean(best)
  }

  let activeFaceOff = faceOff
  if (faceOff && !(fill('faceA') && fill('faceB'))) {
    // One side ran dry: drop the face-off and run a normal day.
    activeFaceOff = null
    chosen.length = 0
    ctx.faceOff = null
    ctx.directorToday = chooseDirector(pool, odds, dayNumber, directorAgo, filmAgo, rng)
    Object.assign(slots, slotDefinitions(ctx))
    delete slots.faceA
    delete slots.faceB
  }
  for (const key of fillOrder(activeFaceOff)) {
    if (key === 'faceA' || key === 'faceB') continue
    fill(key)
  }

  const order = showOrder(activeFaceOff)
  const picked = chosen
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
    .slice(0, count)
    .map(({ key, film, wildcard }) => {
      // A slot that ran dry took any film: say so rather than mislabel it.
      const slot = wildcard ? { label: 'Wildcard' } : slots[key]
      const note = slot.noteFor ? slot.noteFor(film) : slot.note
      return {
        id: film.id,
        slot: key,
        label: slot.labelFor ? slot.labelFor(film) : slot.label,
        ...(note ? { note } : {}),
        ...(slot.faceOff ? { faceOff: slot.faceOff } : {})
      }
    })
  return { films: picked, faceOff: activeFaceOff?.title || null }
}
