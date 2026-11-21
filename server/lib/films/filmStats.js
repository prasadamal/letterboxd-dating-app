// How the community answers each film, smoothed with a prior so that a film with three votes doesn't
// look certain. Everything downstream (daily picks, match weights, challenge weights) reads these.
//
//   pSeen  chance a film fan has seen it       prior from popularity, moved by "haven't seen" answers
//   pLove  chance they liked it, given seen     prior from tags (canon higher, divisive lower)

const SEEN_PRIOR_STRENGTH = 12
// ReelMates launches in India: Indian-language films are far better known to its players than the
// worldwide popularity estimate suggests. Real "haven't seen" answers correct this either way.
export const HOME_MARKET_BOOST = 12
const INDIAN_LANGUAGES = new Set(['Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi'])
const LOVE_PRIOR_STRENGTH = 8

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))
const logistic = (x) => 1 / (1 + Math.exp(-x))

/** Prior chance that someone who loves films has seen it (popularity 90 → 0.98, 60 → 0.64, 36 → 0.11). */
export function seenPrior(popularity, language) {
  let p = Number.isFinite(popularity) ? popularity : 55
  if (INDIAN_LANGUAGES.has(language)) p += HOME_MARKET_BOOST
  return clamp(logistic((p - 55) / 9), 0.04, 0.98)
}

export function lovePrior(film) {
  const tags = film?.tags instanceof Set ? film.tags : new Set(film?.tags || [])
  if (tags.has('divisive')) return 0.52
  if (tags.has('debated')) return 0.58
  if (tags.has('canon') || tags.has('crowd')) return 0.82
  return 0.7
}

/** Smoothed probabilities for one film. `counts`: { likes, dislikes, notSeen } or undefined. */
export function filmOdds(film, counts) {
  const likes = counts?.likes || 0
  const dislikes = counts?.dislikes || 0
  const notSeen = counts?.notSeen || 0
  const seen = likes + dislikes
  const pSeen = (seen + SEEN_PRIOR_STRENGTH * seenPrior(film?.popularity, film?.language || film?.origin_language)) / (seen + notSeen + SEEN_PRIOR_STRENGTH)
  const pLove = (likes + LOVE_PRIOR_STRENGTH * lovePrior(film)) / (seen + LOVE_PRIOR_STRENGTH)
  return { pSeen: clamp(pSeen, 0.02, 0.99), pLove: clamp(pLove, 0.03, 0.97), votes: seen + notSeen }
}

const h2 = (p) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)))

/**
 * How much one answer about this film tells you about a person, in bits.
 *   opinion  splits people who have seen it (0 … 1): a film everyone loves tells little
 *   answer   the three-way answer liked / didn't / haven't seen (0 … 1.58)
 */
export function informativeness({ pSeen, pLove }) {
  const love = pSeen * pLove
  const hate = pSeen * (1 - pLove)
  const skip = 1 - pSeen
  const answer = -[love, hate, skip].reduce((sum, p) => (p > 0 ? sum + p * Math.log2(p) : sum), 0)
  return { opinion: pSeen * h2(pLove), answer }
}

/** Odds for many films at once: Map<id, {pSeen, pLove, votes}>. */
export function oddsByFilm(films, countsById) {
  const out = new Map()
  for (const film of films) out.set(film.id, filmOdds(film, countsById?.get(film.id)))
  return out
}
