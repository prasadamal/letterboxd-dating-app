import express from 'express'
import { getDailyMovies, getMovieById, rateMovie, getUserProfile, ensureUserProfile } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/daily', authMiddleware, async (req, res) => {
  try {
    const movies = await getDailyMovies(req.user.id)
    return res.json({ movies })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load daily movies' })
  }
})

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
    return res.json({ ok: true, user: ensureUserProfile(user) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not save rating' })
  }
})

export default router
