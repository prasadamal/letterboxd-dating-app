// Taste match: how much two people agree on films they have BOTH rated.
//
//   shared like      both said "I like"         → evidence for the match
//   shared dislike   both said "I don't like"   → equally strong evidence
//   conflict         one liked, the other didn't → evidence against
//
// Each film is weighted by rarity: agreeing on an obscure film says more than agreeing on The Godfather.
// The percentage starts at 50% (no shared films = no opinion) and moves with evidence, so one lucky
// overlap can't beat ten real ones:  match = (agree + K/2) / (agree + conflict + K)
//
// All-time favourite (one film each): the same favourite is strong evidence (FAV_SAME); liking or disliking
// the other person's favourite counts more than an ordinary film (FAV_RATED).
//
// Ranking order: match %, then number of films in common. Photo, age and place are filters, not score.

const POPULARITY_MOST = 90 // The Godfather
const POPULARITY_LEAST = 35 // the most obscure films in the catalog
const PRIOR = 3 // weighted films of "no opinion" blended in; bigger = needs more shared films to move
const FAV_SAME = 4
const FAV_RATED = 2

export function rarityWeight(popularity) {
  if (!Number.isFinite(popularity)) return 1.5
  const clamped = Math.min(POPULARITY_MOST, Math.max(POPULARITY_LEAST, popularity))
  return 1 + (POPULARITY_MOST - clamped) / (POPULARITY_MOST - POPULARITY_LEAST) // 1.0 … 2.0
}

// `a` and `b`: { love: Set<movieId>, hate: Set<movieId>, favorite?: movieId,
//                titles?: Map<movieId,label>, popularity?: Map<movieId,number> }
export function compareTaste(a, b) {
  const empty = { score: 50, sharedLove: 0, sharedHate: 0, conflicts: 0, sharedCount: 0, sharedLovedTitles: [], sharedHatedTitles: [], favorite: null }
  if (!a || !b) return empty

  const weightOf = (id) => rarityWeight(a.popularity?.get(id) ?? b.popularity?.get(id))
  const titleOf = (id) => a.titles?.get(id) ?? b.titles?.get(id) ?? String(id)

  const sharedLoved = []
  const sharedHated = []
  let agree = 0
  let disagree = 0

  for (const id of a.love) {
    if (b.love.has(id)) {
      sharedLoved.push(id)
      agree += weightOf(id)
    } else if (b.hate.has(id)) {
      disagree += weightOf(id)
    }
  }
  for (const id of a.hate) {
    if (b.hate.has(id)) {
      sharedHated.push(id)
      agree += weightOf(id)
    } else if (b.love.has(id)) {
      disagree += weightOf(id)
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
    } else if (a.love.has(id)) {
      relation = 'you_liked'
      agree += FAV_RATED
    } else if (a.hate.has(id)) {
      relation = 'you_disliked'
      disagree += FAV_RATED
    }
    favorite = { title: titleOf(id), relation }
  }
  if (a.favorite != null && a.favorite !== b.favorite) {
    if (b.love.has(a.favorite)) agree += FAV_RATED
    else if (b.hate.has(a.favorite)) disagree += FAV_RATED
  }

  const conflicts = [...a.love].filter((id) => b.hate.has(id)).length + [...a.hate].filter((id) => b.love.has(id)).length
  const ratio = (agree + PRIOR / 2) / (agree + disagree + PRIOR)
  const score = Math.max(1, Math.min(99, Math.round(ratio * 100)))

  // Rarest first: those are the titles that say the most about the two of you.
  const byRarity = (x, y) => weightOf(y) - weightOf(x)
  return {
    score,
    sharedLove: sharedLoved.length,
    sharedHate: sharedHated.length,
    conflicts,
    sharedCount: sharedLoved.length + sharedHated.length,
    sharedLovedTitles: sharedLoved.sort(byRarity).map(titleOf),
    sharedHatedTitles: sharedHated.sort(byRarity).map(titleOf),
    favorite
  }
}

export function rankByTaste(a, b) {
  return b.score - a.score || b.sharedCount - a.sharedCount
}
