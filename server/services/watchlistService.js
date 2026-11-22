import { supabase } from '../supabaseClient.js'
import { AppError } from '../middleware/errors.js'
import { canonicalGenres } from '../lib/genres.js'
import { posterUrl } from '../lib/films/filmFeatures.js'

// Generous for a real watchlist, small enough that one member cannot fill the database.
export const WATCHLIST_LIMIT = 500

export function parseMovieId(value) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) throw new AppError('Invalid film', 400, 'VALIDATION_ERROR')
  return id
}

/** Newest first, with just what a film row needs. Films removed from the catalogue drop out. */
export async function listWatchlist(userId) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('created_at, movies(id, title, year, genres, origin_language)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(WATCHLIST_LIMIT)
  if (error) throw error
  return (data || [])
    .filter((row) => row.movies)
    .map((row) => ({
      id: row.movies.id,
      title: row.movies.title,
      year: row.movies.year,
      genres: canonicalGenres(row.movies.genres),
      origin_language: row.movies.origin_language,
      poster_url: posterUrl(row.movies),
      addedAt: row.created_at
    }))
}

/** Idempotent: saving a film twice keeps one entry and its original date. */
export async function addToWatchlist(userId, movieId) {
  const { data: existing, error: existingError } = await supabase
    .from('watchlist').select('movie_id').eq('user_id', userId).eq('movie_id', movieId).maybeSingle()
  if (existingError) throw existingError
  if (existing) return { id: movieId, saved: true }

  const { data: movie, error: movieError } = await supabase.from('movies').select('id').eq('id', movieId).maybeSingle()
  if (movieError) throw movieError
  if (!movie) throw new AppError('Film not found', 404, 'NOT_FOUND')

  const { count, error: countError } = await supabase
    .from('watchlist').select('movie_id', { count: 'exact', head: true }).eq('user_id', userId)
  if (countError) throw countError
  if ((count || 0) >= WATCHLIST_LIMIT) {
    throw new AppError(`Your watchlist holds up to ${WATCHLIST_LIMIT} films. Remove some to add more.`, 409, 'WATCHLIST_FULL')
  }

  const { error } = await supabase
    .from('watchlist')
    .upsert({ user_id: userId, movie_id: movieId }, { onConflict: 'user_id,movie_id', ignoreDuplicates: true })
  if (error) throw error
  return { id: movieId, saved: true }
}

/** Idempotent: removing a film that is not saved succeeds. */
export async function removeFromWatchlist(userId, movieId) {
  const { error } = await supabase.from('watchlist').delete().eq('user_id', userId).eq('movie_id', movieId)
  if (error) throw error
  return { id: movieId, saved: false }
}
