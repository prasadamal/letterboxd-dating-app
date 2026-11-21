// Connection: how alike two people's film taste is, as a percentage with a measure of how sure we are.
//
// 1. Agreement, weighted by surprise. On each film both answered, the weight of agreeing or disagreeing
//    is how unlikely that would be between two random film fans (−ln of its chance), using the
//    community's smoothed odds (lib/films/filmStats.js). Both loving The Godfather barely counts; both
//    disliking it, or both loving a film that splits people, counts a lot. Disagreeing on a film
//    everyone loves counts more than disagreeing on a divisive one.
// 2. Stars. When both logged the film in their diary, the gap between their stars (1–10) shades the
//    agreement: 8 and 9 is close, 8 and 3 is not.
// 3. Exposure. Both having seen a film few people have seen, or both not having seen one most people
//    have, is a small sign of shared taste; one having seen it and the other not is a small sign against.
// 4. Favourites. Sharing the all-time favourite is strong; liking or disliking the other's counts too.
// 5. Taste profile. Each person's likes and dislikes become a profile over genre, language, decade,
//    director, franchise and style. Two people with few films in common still match through it
//    (Ghibli fan ↔ Shinkai fan). It matters less as real shared films pile up.
//
// The direct evidence is a Beta posterior that starts at 50% ("strangers") and moves with weighted
// agreements and disagreements; it is blended with the profile similarity by how much direct
// evidence there is. Result: score (the percentage people see), plus low (a cautious estimate) and
// alpha/beta for the dating deck, which samples from that belief to give promising-but-unproven
// matches a fair chance (lib/deckRanking.js).
import { featureTokens, enrichFilm } from './films/filmFeatures.js'
import { filmOdds } from './films/filmStats.js'

const POPULARITY_MOST = 90
const POPULARITY_LEAST = 35
const PRIOR = 1.5 // pseudo-agreements and pseudo-disagreements: 50% until evidence arrives
const BASE = 0.25 // every shared answer counts at least this much
const CAP = 3 // and at most this much
const EXPOSURE = 0.15 // the "haven't seen" channel is weak
const FAV_SAME = 3
const FAV_RATED = 1.5
const PROFILE_HALF = 6 // direct evidence at which the profile channel has half its say
const MIN_PROFILE_FILMS = 3

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))
const surprise = (p) => clamp(BASE - Math.log(clamp(p, 1e-3, 1)), BASE, CAP)

/** Kept for sorting titles: rarer films first (1.0 … 2.0). */
export function rarityWeight(popularity) {
  if (!Number.isFinite(popularity)) return 1.5
  const clamped = Math.min(POPULARITY_MOST, Math.max(POPULARITY_LEAST, popularity))
  return 1 + (POPULARITY_MOST - clamped) / (POPULARITY_MOST - POPULARITY_LEAST)
}

const stateOf = (p, id) => (p.love?.has(id) ? 'love' : p.hate?.has(id) ? 'hate' : p.skip?.has(id) ? 'skip' : null)

function filmInfo(a, b, id) {
  return a.films?.get(id) || b.films?.get(id) || { id, popularity: a.popularity?.get(id) ?? b.popularity?.get(id) }
}

// Per-person taste profile over film features; cached on the person object.
const profileCache = new WeakMap()
function profileOf(person, oddsOf) {
  if (profileCache.has(person)) return profileCache.get(person)
  const vector = new Map()
  let films = 0
  for (const [set, sign] of [[person.love, 1], [person.hate, -1]]) {
    for (const id of set || []) {
      const info = person.films?.get(id)
      if (!info?.title) continue
      films += 1
      const o = oddsOf(info)
      // A like says more about you when most people didn't like it, and vice versa.
      const weight = sign > 0 ? 0.5 + (1 - o.pLove) : 0.5 + o.pLove
      for (const token of featureTokens(info.primaryGenre ? info : enrichFilm(info))) {
        vector.set(token, (vector.get(token) || 0) + sign * weight)
      }
    }
  }
  const norm = Math.sqrt([...vector.values()].reduce((s, v) => s + v * v, 0))
  const profile = { vector, norm, films }
  profileCache.set(person, profile)
  return profile
}

const TOKEN_WORDS = (token) => {
  const [kind, value] = [token.slice(0, token.indexOf(':')), token.slice(token.indexOf(':') + 1)]
  if (kind === 'g') return `${value.toLowerCase()} films`
  if (kind === 'l') return value === 'English' ? 'English-language films' : `${value} cinema`
  if (kind === 'd') return `films from the ${value}s`
  if (kind === 'dir') return `${value}'s films`
  if (kind === 'fam') return value
  if (token === 'style:arthouse') return 'art-house films'
  if (token === 'style:blockbuster') return 'blockbusters'
  return null
}

function profileSimilarity(pa, pb) {
  if (pa.films < MIN_PROFILE_FILMS || pb.films < MIN_PROFILE_FILMS || !pa.norm || !pb.norm) return null
  let dot = 0
  const shared = []
  for (const [token, va] of pa.vector) {
    const vb = pb.vector.get(token)
    if (vb == null) continue
    dot += va * vb
    if (va > 0 && vb > 0) shared.push({ token, w: va * vb, kind: 'love' })
    if (va < 0 && vb < 0) shared.push({ token, w: va * vb, kind: 'hate' })
  }
  const cos = dot / (pa.norm * pb.norm)
  const reasons = shared
    .filter((s) => !s.token.startsWith('d:') && !s.token.startsWith('pop:') && !s.token.startsWith('g2:'))
    .sort((x, y) => y.w - x.w)
    .slice(0, 3)
    .map((s) => {
      const words = TOKEN_WORDS(s.token)
      return words ? (s.kind === 'love' ? `You both like ${words}` : `Neither of you likes ${words}`) : null
    })
    .filter(Boolean)
  return { cos: clamp(cos, -1, 1), reasons }
}

/**
 * Compare two people.
 * Each person: { love: Set, hate: Set, skip?: Set, stars?: Map<id, 1..10>, favorite?: id,
 *                titles?: Map<id,label>, popularity?: Map<id,number>, films?: Map<id, catalog row> }
 * ctx.odds: Map<id, {pSeen, pLove}> from the community; without it, catalog priors are used.
 */
export function compareTaste(a, b, ctx = {}) {
  const empty = {
    score: 50, low: 50, alpha: PRIOR, beta: PRIOR, evidence: 0, confidence: 'none',
    sharedLove: 0, sharedHate: 0, conflicts: 0, sharedCount: 0, sharedUnseen: [],
    sharedLovedTitles: [], sharedHatedTitles: [], favorite: null, reasons: []
  }
  if (!a || !b) return empty

  const oddsCache = new Map()
  const oddsOf = (info) => {
    if (!oddsCache.has(info.id)) oddsCache.set(info.id, ctx.odds?.get(info.id) || filmOdds(info.primaryGenre ? info : enrichFilm({ title: '', ...info }), undefined))
    return oddsCache.get(info.id)
  }
  const titleOf = (id) => a.titles?.get(id) ?? b.titles?.get(id) ?? String(id)

  let agree = 0
  let disagree = 0
  const sharedLoved = []
  const sharedHated = []
  const sharedUnseen = []
  let conflicts = 0

  const ids = new Set([...(a.love || []), ...(a.hate || []), ...(a.skip || [])])
  for (const id of ids) {
    const sa = stateOf(a, id)
    const sb = stateOf(b, id)
    if (!sa || !sb) continue
    const o = oddsOf(filmInfo(a, b, id))
    if (sa !== 'skip' && sb !== 'skip') {
      let w
      let s
      if (sa === sb) {
        w = sa === 'love' ? surprise(o.pLove) : surprise(1 - o.pLove)
        s = 1
        ;(sa === 'love' ? sharedLoved : sharedHated).push(id)
      } else {
        w = surprise(2 * o.pLove * (1 - o.pLove))
        s = 0
        conflicts += 1
      }
      const starsA = a.stars?.get(id)
      const starsB = b.stars?.get(id)
      if (Number.isFinite(starsA) && Number.isFinite(starsB)) s = 1 - Math.abs(starsA - starsB) / 9
      agree += w * s + EXPOSURE * surprise(o.pSeen) // both having seen a rarely-seen film is a bond too
      disagree += w * (1 - s)
    } else if (sa === 'skip' && sb === 'skip') {
      sharedUnseen.push(id)
      agree += EXPOSURE * surprise(1 - o.pSeen)
    } else {
      disagree += EXPOSURE * surprise(2 * o.pSeen * (1 - o.pSeen))
    }
  }

  // Favourites: `favorite.relation` describes the OTHER person's favourite from a's point of view.
  let favorite = null
  if (b.favorite != null) {
    const id = b.favorite
    let relation = 'not_rated'
    if (a.favorite === id) {
      relation = 'same'
      agree += FAV_SAME
    } else if (a.love?.has(id)) {
      relation = 'you_liked'
      agree += FAV_RATED
    } else if (a.hate?.has(id)) {
      relation = 'you_disliked'
      disagree += FAV_RATED
    }
    favorite = { title: titleOf(id), relation }
  }
  if (a.favorite != null && a.favorite !== b.favorite) {
    if (b.love?.has(a.favorite)) agree += FAV_RATED
    else if (b.hate?.has(a.favorite)) disagree += FAV_RATED
  }

  const evidence = agree + disagree
  const direct = (PRIOR + agree) / (2 * PRIOR + evidence)
  const profile = profileSimilarity(profileOf(a, oddsOf), profileOf(b, oddsOf))
  const lambda = evidence / (evidence + PROFILE_HALF)
  const mean = profile ? lambda * direct + (1 - lambda) * (0.5 + 0.35 * profile.cos) : direct

  // One belief to rank and explore with: mean as above, strength from all the evidence.
  const strength = 2 * PRIOR + evidence + (profile ? 2 : 0)
  const alpha = mean * strength
  const beta = (1 - mean) * strength
  const sd = Math.sqrt((alpha * beta) / (strength * strength * (strength + 1)))
  const score = clamp(Math.round(mean * 100), 1, 99)
  const low = clamp(Math.round((mean - 1.28 * sd) * 100), 1, 99)

  const byRarity = (x, y) => rarityWeight(filmInfo(a, b, y).popularity) - rarityWeight(filmInfo(a, b, x).popularity)
  return {
    score,
    low,
    alpha,
    beta,
    evidence: Math.round(evidence * 10) / 10,
    confidence: evidence < 3 ? 'low' : evidence < 10 ? 'medium' : 'high',
    sharedLove: sharedLoved.length,
    sharedHate: sharedHated.length,
    conflicts,
    sharedCount: sharedLoved.length + sharedHated.length,
    sharedUnseen,
    sharedLovedTitles: sharedLoved.sort(byRarity).map(titleOf),
    sharedHatedTitles: sharedHated.sort(byRarity).map(titleOf),
    favorite,
    reasons: profile?.reasons || []
  }
}

export function rankByTaste(a, b) {
  return b.score - a.score || (b.evidence || 0) - (a.evidence || 0) || b.sharedCount - a.sharedCount
}
