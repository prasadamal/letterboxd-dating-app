import express from 'express'
import { getDailyMovies, getMovieById, rateMovie, store, ensureUserProfile } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/daily', authMiddleware, (req, res) => {
  res.json({ movies: getDailyMovies() })
})

router.post('/:id/rate', authMiddleware, (req, res) => {
  const { id } = req.params
  const { reaction } = req.body
  const user = store.users.find((item) => item.id === req.user.id)
  const movie = getMovieById(id)

  if (!user || !movie) {
    return res.status(404).json({ message: 'User or movie not found' })
  }

  if (!['love', 'hate', 'skip'].includes(reaction)) {
    return res.status(400).json({ message: 'Invalid reaction' })
  }

  rateMovie(user.id, movie.id, reaction)
  return res.json({ ok: true, user: ensureUserProfile(user) })
})

router.get('/', authMiddleware, (req, res) => {
  res.json({ movies: store.movies })
})

export default router
