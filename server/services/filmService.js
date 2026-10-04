import { supabase } from '../supabaseClient.js'
import { selectAll, selectAllIn } from '../lib/paging.js'
import { COLLECTIONS } from '../data/curatedFilmsMeta.js'

const FILM_COLUMNS = 'id, title, year, genres, origin_language, tags, popularity'
const CHART_TTL_MS = 5 * 60_000
let chartCache = null

function publicFilm(movie) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    genres: movie.genres || [],
    origin_language: movie.origin_language,
    tags: movie.tags || []
  }
}

async function myRatings(userId, movieIds) {
  if (!userId || !movieIds.length) return new Map()
  const rows = await selectAllIn(movieIds, (ids) =>
    supabase.from('user_ratings').select('movie_id, rating').eq('user_id', userId).in('movie_id', ids).order('movie_id')
  )
  return new Map(rows.map((row) => [row.movie_id, row.rating]))
}

// Title search for rating any film and picking an all-time favourite.
export async function searchFilms(userId, query, limit = 20) {
  const term = String(query || '').trim().slice(0, 60)
  if (term.length < 2) return []
  const pattern = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
  const { data, error } = await supabase
    .from('movies')
    .select(FILM_COLUMNS)
    .ilike('title', pattern)
    .order('popularity', { ascending: false })
    .limit(limit)
  if (error) throw error
  const ratings = await myRatings(userId, (data || []).map((m) => m.id))
  return (data || []).map((m) => ({ ...publicFilm(m), myRating: ratings.get(m.id) || null }))
}

// People's chart score: share of likes among people who rated it, pulled toward 50% until enough
// people have voted (two imaginary votes each way), so one early like can't top the chart.
export function peopleScore(likes, dislikes) {
  return (likes + 2) / (likes + dislikes + 4)
}

async function loadChart() {
  if (chartCache && chartCache.expires > Date.now()) return chartCache.value
  const [films, stats] = await Promise.all([
    selectAll(() => supabase.from('movies').select(FILM_COLUMNS).order('id')),
    selectAll(() => supabase.from('movie_rating_stats').select('movie_id, likes, dislikes, not_seen').order('movie_id'))
  ])
  const byMovie = new Map(stats.map((row) => [row.movie_id, row]))
  const value = films.map((film) => {
    const s = byMovie.get(film.id) || { likes: 0, dislikes: 0, not_seen: 0 }
    const votes = s.likes + s.dislikes
    return {
      ...publicFilm(film),
      popularity: film.popularity,
      likes: s.likes,
      dislikes: s.dislikes,
      notSeen: s.not_seen,
      votes,
      likedPercent: votes ? Math.round((s.likes / votes) * 100) : null,
      score: peopleScore(s.likes, s.dislikes)
    }
  })
  chartCache = { value, expires: Date.now() + CHART_TTL_MS }
  return value
}

export function invalidateChart() {
  chartCache = null
}

// Community "best films": films people have voted on, ranked by peopleScore; films nobody has rated yet follow
// (most famous first) so a collection is always browsable.
export function rankChart(films) {
  const ranked = films.filter((f) => f.votes > 0).sort((a, b) => b.score - a.score || b.likes - a.likes || b.popularity - a.popularity)
  const unranked = films.filter((f) => f.votes === 0).sort((a, b) => b.popularity - a.popularity)
  return [
    ...ranked.map((f, i) => ({ ...f, rank: i + 1 })),
    ...unranked.map((f) => ({ ...f, rank: null }))
  ]
}

export async function getTopFilms(userId, { tag, limit = 50 } = {}) {
  const all = await loadChart()
  const pool = tag ? all.filter((f) => f.tags.includes(tag)) : all
  const list = rankChart(pool).slice(0, limit)
  const ratings = await myRatings(userId, list.map((f) => f.id))
  return list.map(({ score, popularity, ...film }) => ({ ...film, myRating: ratings.get(film.id) || null }))
}

export async function getCollections() {
  const all = await loadChart()
  return Object.entries(COLLECTIONS).map(([key, name]) => ({ key, name, count: all.filter((f) => f.tags.includes(key)).length }))
}

function topCounts(values, n = 5) {
  const counts = new Map()
  for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }))
}

// Free taste stats (Letterboxd keeps these behind its paid tier).
export async function getTasteStats(userId) {
  const rows = await selectAll(() =>
    supabase
      .from('user_ratings')
      .select('movie_id, rating, movies(genres, origin_language, year)')
      .eq('user_id', userId)
      .order('movie_id')
  )
  const liked = rows.filter((r) => r.rating === 'love')
  const disliked = rows.filter((r) => r.rating === 'hate')
  const decade = (year) => (year ? `${Math.floor(year / 10) * 10}s` : null)
  return {
    liked: liked.length,
    disliked: disliked.length,
    notSeen: rows.filter((r) => r.rating === 'skip').length,
    likeRate: liked.length + disliked.length ? Math.round((liked.length / (liked.length + disliked.length)) * 100) : null,
    topGenres: topCounts(liked.flatMap((r) => r.movies?.genres || [])),
    topLanguages: topCounts(liked.map((r) => r.movies?.origin_language)),
    topDecades: topCounts(liked.map((r) => decade(r.movies?.year)), 4),
    leastLikedGenres: topCounts(disliked.flatMap((r) => r.movies?.genres || []), 3)
  }
}
