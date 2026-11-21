// Ranking the dating deck: who to show next.
//
// Dating is two-sided, so a good card is one you'd like AND who would like you back. Each candidate
// gets a value from:
//   taste     a draw from the connection belief (lib/tasteMatch.js alpha/beta). Thompson sampling:
//             a proven 85% usually wins, but a promising 70% with little evidence sometimes jumps
//             ahead, so new members and quiet raters still get seen and the score learns. The draw
//             is seeded by viewer + day, so the deck doesn't reshuffle on every refresh.
//   reply     how likely they are to like you back: certain if they already liked you; otherwise
//             their own like rate (smoothed), so very selective people don't eat the deck.
//   fresh     active this week beats gone for a month.
//   fairness  people already flooded with unanswered likes are shown a little less, which spreads
//             attention instead of sending everyone to the same few profiles.
//   newcomer  a small lift in someone's first week, so they get a first match before they leave.
// Combined as a weighted geometric mean, so a weak factor pulls the value down but cannot zero it.
import { seededRandom } from './films/dailyPicker.js'

const W = { taste: 0.6, reply: 0.25, fresh: 0.1, fairness: 0.05 }

// Gamma(k, 1) sample (Marsaglia–Tsang), then Beta(a, b) = X / (X + Y).
function gamma(k, rng) {
  if (k < 1) return gamma(k + 1, rng) * Math.pow(rng() || 1e-12, 1 / k)
  const d = k - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x
    let v
    do {
      const u1 = rng() || 1e-12
      const u2 = rng()
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = rng() || 1e-12
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v
  }
}
export function betaSample(alpha, beta, rng) {
  const x = gamma(Math.max(alpha, 0.05), rng)
  const y = gamma(Math.max(beta, 0.05), rng)
  return x / (x + y)
}

export function replyChance({ likedYou, likes = 0, swipes = 0 }) {
  if (likedYou) return 1
  const rate = (likes + 2) / (swipes + 4) // smoothed towards 50%
  return 0.35 + 0.65 * rate
}

/**
 * @param {Array} cards  each: { id, alpha, beta, score, likedYou?, likes?, swipes?, daysSinceActive?,
 *                       pendingLikes?, daysSinceJoined? }
 * @param {string} seed  viewer id + day: the same deck all day, a new draw tomorrow
 * @returns cards sorted best first, each with `rankValue`
 */
export function rankDeck(cards, seed) {
  const ranked = cards.map((card) => {
    const rng = seededRandom(`${seed}:${card.id}`)
    const taste = card.alpha != null ? betaSample(card.alpha, card.beta, rng) : (card.score ?? 50) / 100
    const reply = replyChance(card)
    const fresh = 0.5 + 0.5 * Math.exp(-(card.daysSinceActive ?? 30) / 7)
    const fairness = 1 / Math.sqrt(1 + (card.pendingLikes || 0) / 10)
    const newcomer = (card.daysSinceJoined ?? 99) < 7 ? 1.05 : 1
    const value =
      Math.pow(taste, W.taste) * Math.pow(reply, W.reply) * Math.pow(fresh, W.fresh) * Math.pow(fairness, W.fairness) * newcomer
    return { ...card, rankValue: value }
  })
  return ranked.sort((a, b) => b.rankValue - a.rankValue || b.score - a.score)
}
