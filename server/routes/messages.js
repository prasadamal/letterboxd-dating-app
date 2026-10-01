import express from 'express'
import { findUserById, getConversation, addMessage, isMutualMatch } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { parseId } from '../lib/validation.js'

const router = express.Router()
const MAX_MESSAGE_LENGTH = 1000

// Resolve :userId and make sure the two users have mutually liked each other.
function requireMatchedUser(req, res, next) {
  const otherId = parseId(req.params.userId)
  const other = otherId && findUserById(otherId)
  if (!other || other.id === req.user.id) return res.status(404).json({ message: 'User not found' })
  if (!isMutualMatch(req.user.id, other.id)) {
    return res.status(403).json({ message: 'You can only message users you have matched with' })
  }
  req.other = other
  return next()
}

router.get('/:userId', authMiddleware, requireMatchedUser, (req, res) => {
  return res.json({ with: { id: req.other.id, name: req.other.name, avatar_url: req.other.avatar_url }, messages: getConversation(req.user.id, req.other.id) })
})

router.post('/:userId', authMiddleware, requireMatchedUser, (req, res) => {
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
  if (!body) return res.status(400).json({ message: 'Message body is required' })
  if (body.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ message: `Message must be at most ${MAX_MESSAGE_LENGTH} characters` })

  return res.status(201).json({ message: addMessage(req.user.id, req.other.id, body) })
})

export default router
