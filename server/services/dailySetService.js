// One daily ten for everyone: created by the first request of the UTC day and stored in daily_sets,
// so every player, every challenge link and every later day's picker sees the same films.
import { supabase } from '../supabaseClient.js'
import { selectAll, selectAllIn } from '../lib/paging.js'
import { enrichFilm } from '../lib/films/filmFeatures.js'
import { oddsByFilm } from '../lib/films/filmStats.js'
import { DAILY_COUNT, pickDailySet } from '../lib/films/dailyPicker.js'
import { utcDayNumber } from '../lib/dailyMovies.js'

export const DAILY_ALGORITHM = 'slots-v2'
const HISTORY_DAYS = 150

const dayString = (dayNumber) => new Date(dayNumber * 86_400_000).toISOString().slice(0, 10)
const dayNumberOf = (day) => utcDayNumber(new Date(`${day}T00:00:00Z`))

async function readSet(day) {
  const { data, error } = await supabase.from('daily_sets').select('day, movie_ids, slots, face_off, algorithm').eq('day', day).maybeSingle()
  if (error) throw error
  return data
}

// Everyone's answers so far, for the picker's "how likely is a fan to have seen / liked this" estimates.
async function ratingCounts(ids) {
  const rows = await selectAllIn(ids, (part) =>
    supabase.from('movie_rating_stats').select('movie_id, likes, dislikes, not_seen').in('movie_id', part).order('movie_id')
  )
  return new Map(rows.map((r) => [r.movie_id, { likes: r.likes || 0, dislikes: r.dislikes || 0, notSeen: r.not_seen || 0 }]))
}

// Before this table existed, each player's first visit stored the day's films in daily_batches (the old
// picker gave everyone the same ten). If anyone already has today's films, keep them for the whole day.
async function legacyBatch(day) {
  const { data, error } = await supabase
    .from('daily_batches')
    .select('movie_ids')
    .eq('day', day)
    .eq('seq', 0)
    .limit(1)
  if (error) throw error
  return data?.[0]?.movie_ids?.length ? data[0].movie_ids : null
}

export async function computeDailySet(dayNumber) {
  const catalog = await selectAll(() => supabase.from('movies').select('*').eq('in_deck', true).order('id'))
  const films = catalog.map(enrichFilm)
  const historyFrom = dayString(dayNumber - HISTORY_DAYS)
  const [counts, historyRows] = await Promise.all([
    ratingCounts(films.map((f) => f.id)),
    selectAll(() => supabase.from('daily_sets').select('day, movie_ids').gte('day', historyFrom).lt('day', dayString(dayNumber)).order('day'))
  ])
  const history = historyRows.map((r) => ({ dayNumber: dayNumberOf(r.day), ids: r.movie_ids }))
  return pickDailySet({ films, odds: oddsByFilm(films, counts), dayNumber, history, count: DAILY_COUNT })
}

/** The daily set for a UTC day ('YYYY-MM-DD'), creating it on first use. */
export async function getDailySet(day = new Date().toISOString().slice(0, 10)) {
  const existing = await readSet(day)
  if (existing) return existing

  const legacy = await legacyBatch(day)
  let row
  if (legacy) {
    row = { day, movie_ids: legacy, slots: [], face_off: null, algorithm: 'legacy' }
  } else {
    const picked = await computeDailySet(dayNumberOf(day))
    row = {
      day,
      movie_ids: picked.films.map((f) => f.id),
      slots: picked.films,
      face_off: picked.faceOff,
      algorithm: DAILY_ALGORITHM
    }
  }
  if (!row.movie_ids.length) return row
  const { error } = await supabase.from('daily_sets').insert(row)
  // Two first-visitors at once: the second insert loses and reads the winner's set.
  if (error && error.code !== '23505') throw error
  return (await readSet(day)) || row
}

/** Map<movieId, {slot, label, note?, faceOff?}> for showing each film's slot on its card. */
export function slotInfo(set) {
  return new Map((set?.slots || []).map((s) => [s.id, { slot: s.slot, label: s.label, ...(s.note ? { note: s.note } : {}), ...(s.faceOff ? { faceOff: s.faceOff } : {}) }]))
}
