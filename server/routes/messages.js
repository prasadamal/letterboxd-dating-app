import express from 'express'
import { findUserById, store } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/:userId', authMiddleware, (req, res) => {
  const peerId = Number(req.params.userId)
  const peer = findUserById(peerId)
  if (!peer) return res.status(404).json({ message: 'User not found' })

  const thread = store.messages
    .filter(
      (message) =>
        (message.from_user_id === req.user.id && message.to_user_id === peerId) ||
        (message.from_user_id === peerId && message.to_user_id === req.user.id)
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return res.json({ messages: thread })
})

router.post('/', authMiddleware, (req, res) => {
  const { toUserId, text } = req.body
  if (!toUserId || !text?.trim()) {
    return res.status(400).json({ message: 'Recipient and message text are required' })
  }

  const peer = findUserById(toUserId)
  if (!peer) return res.status(404).json({ message: 'User not found' })

  const message = {
    id: Date.now(),
    from_user_id: req.user.id,
    to_user_id: Number(toUserId),
    text: String(text).trim(),
    created_at: new Date().toISOString()
  }

  store.messages.push(message)
  return res.status(201).json({ message })
})

export default router
