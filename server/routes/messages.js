import express from 'express'
import { findUserById, getMessagesBetween, sendMessage } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const peer = await findUserById(req.params.userId)
    if (!peer) return res.status(404).json({ message: 'User not found' })

    const messages = await getMessagesBetween(req.user.id, req.params.userId)
    return res.json({ messages })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load messages' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { toUserId, text } = req.body
    if (!toUserId || !text?.trim()) {
      return res.status(400).json({ message: 'Recipient and message text are required' })
    }

    const peer = await findUserById(toUserId)
    if (!peer) return res.status(404).json({ message: 'User not found' })

    const message = await sendMessage(req.user.id, toUserId, String(text).trim())
    return res.status(201).json({ message })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not send message' })
  }
})

export default router
