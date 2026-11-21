// The community's smoothed "seen" and "liked" odds for every catalog film (lib/films/filmStats.js),
// cached for a few minutes: matching reads them for every comparison.
import { supabase } from '../supabaseClient.js'
import { selectAll } from '../lib/paging.js'
import { enrichFilm } from '../lib/films/filmFeatures.js'
import { oddsByFilm } from '../lib/films/filmStats.js'

const TTL_MS = 10 * 60 * 1000
let cached = null
let cachedAt = 0
let pending = null

async function load() {
  const [movies, stats] = await Promise.all([
    selectAll(() => supabase.from('movies').select('id, title, year, genres, origin_language, popularity, tags').order('id')),
    selectAll(() => supabase.from('movie_rating_stats').select('movie_id, likes, dislikes, not_seen').order('movie_id'))
  ])
  const counts = new Map(stats.map((r) => [r.movie_id, { likes: r.likes || 0, dislikes: r.dislikes || 0, notSeen: r.not_seen || 0 }]))
  return oddsByFilm(movies.map(enrichFilm), counts)
}

/** Map<movieId, {pSeen, pLove, votes}>. Falls back to the last good copy (or catalog priors) on error. */
export async function getCommunityOdds() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached
  pending ||= load()
    .then((odds) => {
      cached = odds
      cachedAt = Date.now()
      return odds
    })
    .catch(() => cached || new Map())
    .finally(() => {
      pending = null
    })
  return pending
}
