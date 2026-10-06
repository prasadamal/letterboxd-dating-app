import express from 'express'
import { getMovieById, rateMovie, ensureUserProfile } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { getCollections, getTopFilms, searchFilms } from '../services/filmService.js'
import { COLLECTIONS } from '../data/curatedFilmsMeta.js'
import { recordDailyActivity } from '../services/growthService.js'
import { dailyNumber, getDailyMoviesWithCommunity, getDailyResults } from '../services/dailyService.js'

const router = express.Router()

// Today's films still to rate, each with the crowd's verdict so far (shown after you swipe).
router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const movies = await getDailyMoviesWithCommunity(req.user.id)
    return res.json({ movies, number: dailyNumber() })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load daily movies' })
  }
})

// How you and everyone voted on today's films, plus a Wordle-style share line.
router.get(
  '/daily/results',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json({ results: await getDailyResults(req.user.id) })
  })
)

router.get(
  '/search',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const films = await searchFilms(req.user.id, typeof req.query.q === 'string' ? req.query.q : '')
    return res.json({ films })
  })
)

// People's chart: films ranked by how many people liked them; optional ?collection=malayalam etc.
router.get(
  '/top',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const tag = typeof req.query.collection === 'string' && COLLECTIONS[req.query.collection] ? req.query.collection : undefined
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50))
    const films = await getTopFilms(req.user.id, { tag, limit })
    return res.json({ films, collection: tag || null })
  })
)

router.get(
  '/collections',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json({ collections: await getCollections() })
  })
)

router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { reaction } = req.body
    const movie = await getMovieById(id)

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' })
    }

    if (!['love', 'hate', 'skip'].includes(reaction)) {
      return res.status(400).json({ message: 'Invalid reaction' })
    }

    const user = await rateMovie(req.user.id, movie.id, reaction)
    // A failed streak update must never lose the rating.
    const streak = await recordDailyActivity(req.user.id).catch(() => null)
    return res.json({ ok: true, user: ensureUserProfile(streak ? { ...user, streak } : user), streak })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not save rating' })
  }
})

export default router
