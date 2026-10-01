import express from 'express'
import { getDailyMovies, getMovieById, rateMovie, store, findUserById, publicUser } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/daily', authMiddleware, (req, res) => {
  res.json({ movies: getDailyMovies(req.user.id) })
})

router.post('/:id/rate', authMiddleware, (req, res) => {
  const reaction = req.body?.reaction
  const user = findUserById(req.user.id)
  const movie = getMovieById(req.params.id)

  if (!user || !movie) {
    return res.status(404).json({ message: 'User or movie not found' })
  }

  if (!['love', 'hate', 'skip'].includes(reaction)) {
    return res.status(400).json({ message: 'Reaction must be one of: love, hate, skip' })
  }

  rateMovie(user.id, movie.id, reaction)
  return res.json({ ok: true, user: publicUser(user) })
})

router.get('/', authMiddleware, (req, res) => {
  res.json({ movies: store.movies })
})

export default router
