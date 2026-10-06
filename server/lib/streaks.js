// Daily-game streak: consecutive UTC days with at least one rating.

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function dayDiff(fromDay, toDay) {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000)
}

// Returns the new state, or null when nothing changes (already counted today).
export function nextStreak({ current = 0, best = 0, lastDay = null } = {}, today = utcDay()) {
  if (lastDay === today) return null
  const continues = lastDay && dayDiff(lastDay, today) === 1
  const nextCurrent = continues ? current + 1 : 1
  return { current: nextCurrent, best: Math.max(best, nextCurrent), lastDay: today }
}

// What to show: a streak whose last day is before yesterday has lapsed.
export function displayStreak({ current = 0, best = 0, lastDay = null } = {}, today = utcDay()) {
  const alive = lastDay && dayDiff(lastDay, today) <= 1
  return { current: alive ? current : 0, best, playedToday: lastDay === today }
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365]
