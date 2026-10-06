import { supabase } from '../supabaseClient.js'
import { env } from '../config/env.js'
import { getDailyMovies } from '../db.js'
import { selectAllIn } from '../lib/paging.js'
import { canonicalGenres } from '../lib/genres.js'
import { displayStreak, utcDay } from '../lib/streaks.js'
import { utcDayNumber } from '../lib/dailyMovies.js'

// Daily #1 is 2026-10-01; the number goes up by one every UTC day, the same for everyone.
const FIRST_DAILY = utcDayNumber(new Date('2026-10-01T00:00:00Z'))
export const dailyNumber = (date = new Date()) => utcDayNumber(date) - FIRST_DAILY + 1

const MIN_VOTES_FOR_HIGHLIGHT = 4

export function likedPercent(likes, dislikes) {
  const votes = likes + dislikes
  return votes ? Math.round((likes / votes) * 100) : null
}

// How everyone has rated these films so far: { movieId → { likes, dislikes, notSeen } }.
export async function communityCounts(movieIds) {
  const rows = await selectAllIn(movieIds, (ids) =>
    supabase.from('movie_rating_stats').select('movie_id, likes, dislikes, not_seen').in('movie_id', ids).order('movie_id')
  )
  return new Map(rows.map((r) => [r.movie_id, { likes: r.likes || 0, dislikes: r.dislikes || 0, notSeen: r.not_seen || 0 }]))
}

// Today's unrated films with the crowd's verdict so far (the app reveals it after you swipe).
export async function getDailyMoviesWithCommunity(userId) {
  const movies = await getDailyMovies(userId)
  const counts = await communityCounts(movies.map((m) => m.id))
  return movies.map((movie) => {
    const c = counts.get(movie.id) || { likes: 0, dislikes: 0 }
    return {
      ...movie,
      genres: canonicalGenres(movie.genres),
      community: { likedPercent: likedPercent(c.likes, c.dislikes), votes: c.likes + c.dislikes }
    }
  })
}

const SQUARE = { love: '🟩', hate: '🟥', skip: '⬜' }

function shareHost() {
  try {
    return env.APP_PUBLIC_URL ? new URL(env.APP_PUBLIC_URL).host : 'reelmates.app'
  } catch {
    return 'reelmates.app'
  }
}

// Pure summary of a finished (or partly played) day; exported for tests.
export function summarizeDay({ films, number, streak = 0 }) {
  let agreed = 0
  let comparable = 0
  for (const film of films) {
    if (film.myRating !== 'love' && film.myRating !== 'hate') continue
    // The crowd without you: your own vote is already in the counts.
    const likes = film.likes - (film.myRating === 'love' ? 1 : 0)
    const dislikes = film.dislikes - (film.myRating === 'hate' ? 1 : 0)
    if (likes === dislikes) continue
    comparable += 1
    if ((film.myRating === 'love') === likes > dislikes) agreed += 1
  }

  const voted = films.filter((f) => f.likes + f.dislikes >= MIN_VOTES_FOR_HIGHLIGHT)
  const byCloseness = [...voted].sort((a, b) => Math.abs(a.likedPercent - 50) - Math.abs(b.likedPercent - 50))
  const byLikes = [...voted].sort((a, b) => b.likedPercent - a.likedPercent)
  const pick = (film) => (film ? { id: film.id, title: film.title, likedPercent: film.likedPercent } : null)

  const played = films.filter((f) => f.myRating).length
  const grid = films.map((f) => SQUARE[f.myRating] || '⬛').join('')
  const lines = [`ReelMates Daily #${number} 🎬`, grid]
  const extras = []
  if (comparable) extras.push(`Agreed with the crowd on ${agreed}/${comparable}`)
  if (streak >= 2) extras.push(`🔥 ${streak}`)
  if (extras.length) lines.push(extras.join(' · '))
  lines.push(shareHost())

  return {
    number,
    played,
    total: films.length,
    complete: films.length > 0 && played === films.length,
    agreed,
    comparable,
    mostDivisive: pick(byCloseness[0]),
    crowdFavourite: pick(byLikes[0]),
    shareText: lines.join('\n')
  }
}

// Today's ten films with your verdicts and everyone's, plus a shareable result line.
export async function getDailyResults(userId, now = new Date()) {
  const day = utcDay(now)
  const batchQuery = () =>
    supabase.from('daily_batches').select('movie_ids').eq('user_id', userId).eq('day', day).eq('seq', 0).maybeSingle()

  let { data: batch, error } = await batchQuery()
  if (error) throw error
  if (!batch) {
    await getDailyMovies(userId) // creates today's batch
    ;({ data: batch, error } = await batchQuery())
    if (error) throw error
  }
  const ids = batch?.movie_ids || []

  const [movies, mine, counts, userRow] = await Promise.all([
    selectAllIn(ids, (part) => supabase.from('movies').select('id, title, year, genres, origin_language').in('id', part).order('id')),
    selectAllIn(ids, (part) =>
      supabase
        .from('user_ratings')
        .select('movie_id, rating')
        .eq('user_id', userId)
        .gte('rated_at', `${day}T00:00:00.000Z`)
        .in('movie_id', part)
        .order('movie_id')
    ),
    communityCounts(ids),
    supabase.from('users').select('streak_current, streak_best, streak_last_day').eq('id', userId).maybeSingle()
  ])
  if (userRow.error) throw userRow.error

  const byId = new Map(movies.map((m) => [m.id, m]))
  const myRating = new Map(mine.map((r) => [r.movie_id, r.rating]))
  const films = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((m) => {
      const c = counts.get(m.id) || { likes: 0, dislikes: 0, notSeen: 0 }
      return {
        id: m.id,
        title: m.title,
        year: m.year,
        genres: canonicalGenres(m.genres),
        origin_language: m.origin_language,
        myRating: myRating.get(m.id) || null,
        likes: c.likes,
        dislikes: c.dislikes,
        notSeen: c.notSeen,
        likedPercent: likedPercent(c.likes, c.dislikes)
      }
    })

  const streak = displayStreak(
    { current: userRow.data?.streak_current, best: userRow.data?.streak_best, lastDay: userRow.data?.streak_last_day },
    day
  )
  return { day, ...summarizeDay({ films, number: dailyNumber(now), streak: streak.current }), streak, films }
}
