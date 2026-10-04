/** Films from today's batch that the user has not rated yet today. */
export function pendingDailyMovies(movies, ratedTodayIds) {
  const rated = ratedTodayIds instanceof Set ? ratedTodayIds : new Set(ratedTodayIds || [])
  return (movies || []).filter((movie) => movie && !rated.has(movie.id))
}

function hashSeed(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function seededShuffle(items, seedKey) {
  const copy = [...items]
  let seed = hashSeed(seedKey)
  for (let i = copy.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
    const j = seed % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Days since 1970-01-01 in UTC: the same number for every player at the same moment. */
export function utcDayNumber(date = new Date()) {
  return Math.floor(date.getTime() / 86_400_000)
}

/**
 * Today's films — identical for every player, so people build up films in common to match on.
 * The catalog is shuffled once per cycle and handed out `count` at a time, so no film repeats until
 * every film has been shown; the next cycle uses a new shuffle (and re-rating refines old answers).
 */
export function sharedDailySet(pool, dayNumber, count) {
  const ordered = [...pool].sort((a, b) => a.id - b.id)
  if (!ordered.length || count <= 0) return []
  const daysPerCycle = Math.max(1, Math.floor(ordered.length / count))
  const cycle = Math.floor(dayNumber / daysPerCycle)
  const slot = dayNumber % daysPerCycle
  return seededShuffle(ordered, `reelmates-cycle:${cycle}`).slice(slot * count, slot * count + count)
}
