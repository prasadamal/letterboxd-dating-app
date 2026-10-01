import express from 'express'
import { store, findUserById, getMatchesForUser, presentMatch, hasLiked, hasPassed, isMutualMatch } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { parseId } from '../lib/validation.js'

const router = express.Router()

router.get('/', authMiddleware, (req, res) => {
  return res.json({ matches: getMatchesForUser(req.user.id) })
})

// People you have mutually liked (these are the only users you can message).
router.get('/mutual', authMiddleware, (req, res) => {
  const matches = getMatchesForUser(req.user.id).filter((person) => person.matched)
  return res.json({ matches })
})

router.post('/:matchId/like', authMiddleware, (req, res) => {
  const targetId = parseId(req.params.matchId)
  const target = targetId && findUserById(targetId)
  if (!target) return res.status(404).json({ message: 'User not found' })
  if (target.id === req.user.id) return res.status(400).json({ message: 'You cannot like yourself' })

  const alreadyLiked = hasLiked(req.user.id, target.id)
  if (!alreadyLiked) {
    store.likes.push({ from_user_id: req.user.id, to_user_id: target.id, created_at: new Date() })
  }
  // A like overrides an earlier pass.
  store.passes = store.passes.filter((pass) => !(pass.from_user_id === req.user.id && pass.to_user_id === target.id))

  return res.json({ ok: true, alreadyLiked, matched: isMutualMatch(req.user.id, target.id) })
})

router.post('/:matchId/pass', authMiddleware, (req, res) => {
  const targetId = parseId(req.params.matchId)
  const target = targetId && findUserById(targetId)
  if (!target) return res.status(404).json({ message: 'User not found' })
  if (target.id === req.user.id) return res.status(400).json({ message: 'You cannot pass yourself' })

  if (!hasPassed(req.user.id, target.id)) {
    store.passes.push({ from_user_id: req.user.id, to_user_id: target.id, created_at: new Date() })
  }
  return res.json({ ok: true })
})

router.get('/:matchId', authMiddleware, (req, res) => {
  const user = findUserById(req.user.id)
  const targetId = parseId(req.params.matchId)
  const match = targetId && findUserById(targetId)
  if (!user || !match || match.id === user.id) return res.status(404).json({ message: 'Match not found' })

  return res.json({ match: presentMatch(user, match) })
})

export default router
