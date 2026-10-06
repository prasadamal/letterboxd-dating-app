import express from 'express'
import { findUserById, getMessagesBetween, getMutualMatchRow, sendMessage, getConversationsForUser, markMessagesRead, getChatMeta } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import { validateBody, messageSchema } from '../middleware/validate.js'
import { containsBlockedContent } from '../lib/contentFilter.js'
import { getIcebreakers } from '../services/growthService.js'

const router = express.Router()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Peer ids end up in PostgREST filters; reject anything that isn't a UUID before it gets there.
router.param('userId', (req, res, next, value) => {
  if (!UUID_RE.test(value)) return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' })
  next()
})

router.get(
  '/conversations',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const conversations = await getConversationsForUser(req.user.id)
    return res.json({ conversations })
  })
)

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const peer = await findUserById(req.params.userId)
    if (!peer) return res.status(404).json({ message: 'User not found' })

    const since = typeof req.query.since === 'string' ? req.query.since : null
    const meta = await getChatMeta(req.user.id, req.params.userId)
    if (!meta) return res.status(404).json({ message: 'No conversation' })

    const messages = await getMessagesBetween(req.user.id, req.params.userId, { since })
    return res.json({
      messages,
      conversationId: meta.conversationId,
      realtimeChannel: meta.realtimeChannel,
      chatUnlocked: meta.chatUnlocked,
      introPending: meta.introPending
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load messages' })
  }
})

// Hello ideas built from what the two of you share.
router.get(
  '/:userId/starters',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json({ starters: await getIcebreakers(req.user.id, req.params.userId) })
  })
)

router.post('/:userId/read', authMiddleware, async (req, res) => {
  try {
    const updated = await markMessagesRead(req.user.id, req.params.userId)
    return res.json({ ok: true, updated })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not mark messages read' })
  }
})

router.post('/', authMiddleware, validateBody(messageSchema), async (req, res) => {
  try {
    const { toUserId, text } = req.body
    if (containsBlockedContent(text)) {
      return res.status(422).json({ message: 'This message breaks our community rules and was not sent.', code: 'CONTENT_BLOCKED' })
    }

    const peer = await findUserById(toUserId)
    if (!peer) return res.status(404).json({ message: 'User not found' })

    const message = await sendMessage(req.user.id, toUserId, String(text).trim())
    return res.status(201).json({ message })
  } catch (error) {
    if (error.code === 'NO_MATCH' || error.code === 'INTRO_LIMIT' || error.code === 'CHAT_CLOSED') {
      return res.status(403).json({ message: error.message, code: error.code })
    }
    console.error(error)
    return res.status(500).json({ message: 'Could not send message' })
  }
})

export default router
