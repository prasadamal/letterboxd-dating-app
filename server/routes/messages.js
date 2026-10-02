import express from 'express'
import { findUserById, getMessagesBetween, getMutualMatchRow, sendMessage } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const peer = await findUserById(req.params.userId)
    if (!peer) return res.status(404).json({ message: 'User not found' })

    const match = await getMutualMatchRow(req.user.id, req.params.userId)
    const messages = await getMessagesBetween(req.user.id, req.params.userId)
    return res.json({
      messages,
      chatUnlocked: Boolean(match?.chat_unlocked),
      introPending: Boolean(match && !match.chat_unlocked)
    })
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
    if (error.code === 'NO_MATCH' || error.code === 'INTRO_LIMIT') {
      return res.status(403).json({ message: error.message, code: error.code })
    }
    console.error(error)
    return res.status(500).json({ message: 'Could not send message' })
  }
})

export default router
