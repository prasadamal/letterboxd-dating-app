import express from 'express'
import { store, getMatchesForUser, buildTasteSummary, computeCompatibility, ensureUserProfile } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  const matches = getMatchesForUser(req.user.id)
  return res.json({ matches })
})

router.post('/:matchId/like', authMiddleware, (req, res) => {
  store.likes.push({
    from_user_id: req.user.id,
    to_user_id: Number(req.params.matchId),
    created_at: new Date()
  })
  return res.json({ ok: true })
})

router.get('/:matchId', authMiddleware, (req, res) => {
  const user = store.users.find((item) => item.id === req.user.id)
  const match = store.users.find((item) => item.id === Number(req.params.matchId))
  if (!user || !match) return res.status(404).json({ message: 'Match not found' })

  return res.json({
    match: {
      ...ensureUserProfile(match),
      score: computeCompatibility(user, match),
      tasteSummary: buildTasteSummary(user, match)
    }
  })
})

export default router
