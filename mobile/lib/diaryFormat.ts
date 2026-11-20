// Pure helpers for the film diary. No React, no network, so they test alone.

export type DiaryFilm = { id: number; title: string; year?: number | null; genres?: string[]; origin_language?: string }
export type DiaryEntry = {
  id: string
  watchedOn: string // YYYY-MM-DD, the member's own calendar day
  stars: number | null // 1 = half a star … 10 = five stars
  note: string | null
  rewatch: boolean
  loggedAt: string
  film: DiaryFilm
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Today, yesterday, … as YYYY-MM-DD in the phone's own time zone. */
export function localDay(date: Date, offsetDays = 0): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Moves a YYYY-MM-DD day by whole days without time-zone surprises. */
export function shiftDay(day: string, by: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return localDay(new Date(y, m - 1, d), by)
}

/** "Today", "Yesterday", or "Mon 3 Nov" (with the year when it is not this year). */
export function dayLabel(day: string, today: Date): string {
  if (day === localDay(today)) return 'Today'
  if (day === localDay(today, -1)) return 'Yesterday'
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  const base = `${weekday} ${d} ${MONTHS[m - 1].slice(0, 3)}`
  return y === today.getFullYear() ? base : `${base} ${y}`
}

/** "Tue" for a YYYY-MM-DD day. */
export function weekdayShort(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(y, m - 1, d).getDay()]
}

/** Entries grouped by month, newest month first, in the order given (the server sends newest first). */
export function groupByMonth(entries: DiaryEntry[]): { key: string; title: string; entries: DiaryEntry[] }[] {
  const groups: { key: string; title: string; entries: DiaryEntry[] }[] = []
  for (const entry of entries) {
    const key = entry.watchedOn.slice(0, 7)
    let group = groups[groups.length - 1]
    if (!group || group.key !== key) {
      const [y, m] = key.split('-').map(Number)
      group = { key, title: `${MONTHS[m - 1]} ${y}`, entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  return groups
}

/** Headline numbers: films this year, this month, distinct films ever and the average rating. */
export function diaryStats(entries: DiaryEntry[], today: Date) {
  const year = String(today.getFullYear())
  const month = localDay(today).slice(0, 7)
  const rated = entries.filter((e) => e.stars != null)
  const average = rated.length ? rated.reduce((sum, e) => sum + (e.stars as number), 0) / rated.length / 2 : null
  return {
    thisYear: entries.filter((e) => e.watchedOn.startsWith(year)).length,
    thisMonth: entries.filter((e) => e.watchedOn.startsWith(month)).length,
    films: new Set(entries.map((e) => e.film.id)).size,
    average: average == null ? null : Math.round(average * 10) / 10
  }
}

/**
 * Tapping star n (1–5): a fresh tap gives n full stars, tapping the same full star makes it a half,
 * and tapping that half clears the rating. Returns the new value in half stars (1–10) or null.
 */
export function tapStar(current: number | null, n: number): number | null {
  const full = n * 2
  if (current === full) return full - 1
  if (current === full - 1) return null
  return full
}

/** "★★★½" for display, and words for screen readers. */
export function starsText(value: number | null): string {
  if (!value) return ''
  return '★'.repeat(Math.floor(value / 2)) + (value % 2 ? '½' : '')
}

export function starsSpoken(value: number | null): string {
  if (!value) return 'No rating'
  const n = value / 2
  return n === 1 ? '1 star' : `${n} stars`
}
