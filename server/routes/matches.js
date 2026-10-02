import express from 'express'
import { getMatchesForUser, getUserProfile, computeCompatibilityFromMaps, buildTasteSummary } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const matches = await getMatchesForUser(req.user.id)
    return res.json({ matches })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load matches' })
  }
})

router.post('/:matchId/like', authMiddleware, async (req, res) => {
  try {
    await getMatchesForUser(req.user.id)
    return res.json({ ok: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not save like' })
  }
})

router.get('/:matchId', authMiddleware, async (req, res) => {
  try {
    const peer = await getUserProfile(req.params.matchId)
    const self = await getUserProfile(req.user.id)
    if (!peer || !self) return res.status(404).json({ message: 'Match not found' })

    const { data: ratings, error } = await supabase
      .from('user_ratings')
      .select('user_id, rating, movie_id, movies(title, year)')
      .in('user_id', [req.user.id, req.params.matchId])
      .in('rating', ['love', 'hate'])

    if (error) throw error

    const maps = new Map()
    for (const row of ratings || []) {
      if (!maps.has(row.user_id)) maps.set(row.user_id, { love: new Set(), hate: new Set(), labels: { love: [], hate: [] } })
      const bucket = maps.get(row.user_id)
      const label = row.movies ? `${row.movies.title} (${row.movies.year})` : String(row.movie_id)
      if (row.rating === 'love') {
        bucket.love.add(row.movie_id)
        bucket.labels.love.push(label)
      }
      if (row.rating === 'hate') {
        bucket.hate.add(row.movie_id)
        bucket.labels.hate.push(label)
      }
    }

    const stats = computeCompatibilityFromMaps(maps.get(req.user.id), maps.get(req.params.matchId))

    return res.json({
      match: {
        ...peer,
        score: stats.score,
        tasteSummary: buildTasteSummary(maps.get(req.user.id)?.labels, maps.get(req.params.matchId)?.labels)
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load match' })
  }
})

export default router
