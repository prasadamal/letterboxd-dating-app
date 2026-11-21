// Taste challenge scoring: two people's answers to the same ten films → how connected they are.
//
// Per film:  same answer (liked/liked, didn't/didn't, haven't seen/haven't seen)  = 1
//            liked vs didn't like                                               = 0
//            seen (either way) vs haven't seen                                  = 0.5 (no clash of taste,
//                                                                                 just not shared yet)
// Films count by how varied people's answers usually are (0.5 + bits of answer entropy), so matching
// on a film that splits people counts more than matching on one everybody loves. Identical answers
// are always 100%; anything less is at most 99%.
import { informativeness } from './films/filmStats.js'

export const ANSWERS = ['love', 'hate', 'skip']
const SEEN_VS_UNSEEN = 0.5

export function answerSimilarity(a, b) {
  if (a === b) return 1
  if (a === 'skip' || b === 'skip') return SEEN_VS_UNSEEN
  return 0
}

export function verdictFor(score) {
  if (score >= 90) return { title: 'Film soulmates', line: 'You see films the same way. Rare.' }
  if (score >= 75) return { title: 'Same wavelength', line: 'Hand them the remote. You will both be happy.' }
  if (score >= 60) return { title: 'Good watch partners', line: 'Mostly in sync, with a few fun arguments.' }
  if (score >= 45) return { title: 'Different tastes, great debates', line: 'You would never run out of things to talk about.' }
  return { title: 'Opposites attract?', line: 'Swap recommendations: you each have a lot to show the other.' }
}

/** Throws a message for people (not a code) when answers are incomplete or invalid. */
export function validateAnswers(answers, filmIds) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Answer every film first.')
  const clean = {}
  for (const id of filmIds) {
    const value = answers[id] ?? answers[String(id)]
    if (!ANSWERS.includes(value)) throw new Error('Answer every film first.')
    clean[id] = value
  }
  return clean
}

/**
 * @param {object} p
 * @param {number[]} p.filmIds
 * @param {object} p.mine     {id: 'love'|'hate'|'skip'} the person answering
 * @param {object} p.theirs   the challenge owner's answers
 * @param {Map} [p.odds]      Map<id, {pSeen, pLove}>
 * @param {Map} [p.titles]    Map<id, title>
 */
export function scoreChallenge({ filmIds, mine, theirs, odds = new Map(), titles = new Map() }) {
  let total = 0
  let got = 0
  let same = 0
  const films = []
  for (const id of filmIds) {
    const a = mine[id]
    const b = theirs[id]
    if (!a || !b) continue
    const o = odds.get(id) || { pSeen: 0.6, pLove: 0.7 }
    const weight = 0.5 + informativeness(o).answer
    const sim = answerSimilarity(a, b)
    total += weight
    got += weight * sim
    if (a === b) same += 1
    films.push({ id, title: titles.get(id) || null, mine: a, theirs: b, same: a === b, weight: Math.round(weight * 100) / 100 })
  }
  const exact = films.length > 0 && same === films.length
  const score = exact ? 100 : total ? Math.min(99, Math.round((got / total) * 100)) : 0

  // Something to do next: a film one of you loved that the other hasn't seen.
  const pick = (who, other) =>
    films
      .filter((f) => f[who] === 'love' && f[other] === 'skip')
      .sort((x, y) => (odds.get(y.id)?.pLove ?? 0.7) - (odds.get(x.id)?.pLove ?? 0.7))[0] || null
  const forYou = pick('theirs', 'mine')
  const forThem = pick('mine', 'theirs')
  const bothUnseen = films.find((f) => f.mine === 'skip' && f.theirs === 'skip') || null

  return {
    score,
    same,
    total: films.length,
    verdict: verdictFor(score),
    films,
    bothLoved: films.filter((f) => f.mine === 'love' && f.theirs === 'love').map((f) => f.id),
    clashes: films.filter((f) => answerSimilarity(f.mine, f.theirs) === 0).map((f) => f.id),
    watchNext: { forYou: forYou?.id ?? null, forThem: forThem?.id ?? null, together: bothUnseen?.id ?? null }
  }
}
