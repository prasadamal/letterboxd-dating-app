import { supabase } from '../supabaseClient.js'
import { AppError } from '../middleware/errors.js'
import { canonicalGenres } from '../lib/genres.js'
import { parseMovieId, removeFromWatchlist } from './watchlistService.js'

// A film a day for more than thirteen years. Keeps one member from filling the database.
export const DIARY_LIMIT = 5000
export const NOTE_LIMIT = 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SELECT = 'id, movie_id, watched_on, stars, note, rewatch, created_at, movies(id, title, year, genres, origin_language)'

const invalid = (message) => new AppError(message, 400, 'VALIDATION_ERROR')

export function parseEntryId(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw invalid('Invalid diary entry')
  return value.toLowerCase()
}

/** "YYYY-MM-DD" in UTC, `days` from `now`. */
function utcDay(now, days = 0) {
  return new Date(now.getTime() + days * 86400000).toISOString().slice(0, 10)
}

/**
 * Checks what a member typed. `partial` is for edits, where missing fields stay as they are.
 * The date may be "tomorrow" in UTC because the member's own day can be ahead of the server's.
 */
export function parseDiaryInput(body, { now = new Date(), partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Invalid diary entry')
  const out = {}

  if (body.watchedOn !== undefined || !partial) {
    const day = body.watchedOn
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw invalid('Pick the day you watched it')
    const parsed = new Date(`${day}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) throw invalid('Pick the day you watched it')
    if (day > utcDay(now, 1)) throw invalid("That day hasn't happened yet")
    if (day < '1900-01-01') throw invalid('Pick the day you watched it')
    out.watched_on = day
  }

  if (body.stars !== undefined) {
    if (body.stars === null) out.stars = null
    else if (Number.isInteger(body.stars) && body.stars >= 1 && body.stars <= 10) out.stars = body.stars
    else throw invalid('Ratings go from half a star to five stars')
  } else if (!partial) out.stars = null

  if (body.note !== undefined) {
    if (body.note === null) out.note = null
    else if (typeof body.note !== 'string') throw invalid('Invalid note')
    else {
      const note = body.note.replace(/\r\n/g, '\n').trim()
      if (note.length > NOTE_LIMIT) throw invalid(`Notes can be up to ${NOTE_LIMIT} characters`)
      out.note = note || null
    }
  } else if (!partial) out.note = null

  if (body.rewatch !== undefined) {
    if (typeof body.rewatch !== 'boolean') throw invalid('Invalid rewatch flag')
    out.rewatch = body.rewatch
  } else if (!partial) out.rewatch = false

  if (partial && !Object.keys(out).length) throw invalid('Nothing to change')
  return out
}

function toEntry(row) {
  return {
    id: row.id,
    watchedOn: row.watched_on,
    stars: row.stars,
    note: row.note,
    rewatch: row.rewatch,
    loggedAt: row.created_at,
    film: {
      id: row.movies.id,
      title: row.movies.title,
      year: row.movies.year,
      genres: canonicalGenres(row.movies.genres),
      origin_language: row.movies.origin_language
    }
  }
}

/** Newest viewing first. Entries for films removed from the catalogue drop out. */
export async function listDiary(userId) {
  const { data, error } = await supabase
    .from('diary_entries')
    .select(SELECT)
    .eq('user_id', userId)
    .order('watched_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(DIARY_LIMIT)
  if (error) throw error
  return (data || []).filter((row) => row.movies).map(toEntry)
}

export async function addDiaryEntry(userId, movieIdValue, body) {
  const movieId = parseMovieId(movieIdValue)
  const fields = parseDiaryInput(body)

  const { data: movie, error: movieError } = await supabase.from('movies').select('id').eq('id', movieId).maybeSingle()
  if (movieError) throw movieError
  if (!movie) throw new AppError('Film not found', 404, 'NOT_FOUND')

  const { count, error: countError } = await supabase
    .from('diary_entries').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  if (countError) throw countError
  if ((count || 0) >= DIARY_LIMIT) {
    throw new AppError(`Your diary holds up to ${DIARY_LIMIT} entries.`, 409, 'DIARY_FULL')
  }

  const { data, error } = await supabase
    .from('diary_entries')
    .insert({ ...fields, user_id: userId, movie_id: movieId })
    .select(SELECT)
    .single()
  if (error) throw error
  // Watched it, so it no longer needs to be on the watchlist. Best effort, never loses the entry.
  await removeFromWatchlist(userId, movieId).catch(() => null)
  return toEntry(data)
}

export async function updateDiaryEntry(userId, entryIdValue, body) {
  const id = parseEntryId(entryIdValue)
  const fields = parseDiaryInput(body, { partial: true })
  const { data, error } = await supabase
    .from('diary_entries')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select(SELECT)
    .maybeSingle()
  if (error) throw error
  // Someone else's entry looks exactly like a missing one.
  if (!data || !data.movies) throw new AppError('Diary entry not found', 404, 'NOT_FOUND')
  return toEntry(data)
}

/** Idempotent: deleting an entry that is already gone succeeds. */
export async function deleteDiaryEntry(userId, entryIdValue) {
  const id = parseEntryId(entryIdValue)
  const { error } = await supabase.from('diary_entries').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
  return { id, deleted: true }
}
