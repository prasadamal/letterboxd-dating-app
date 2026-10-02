import express from 'express'
import { blockUser, deleteUserAccount, reportUser } from '../safetyService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.post('/block', authMiddleware, async (req, res) => {
  try {
    const { userId, reason } = req.body
    if (!userId) return res.status(400).json({ message: 'userId is required' })
    const result = await blockUser(req.user.id, userId, reason)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Could not block user' })
  }
})

router.post('/report', authMiddleware, async (req, res) => {
  try {
    const { userId, reason, details } = req.body
    if (!userId || !reason) {
      return res.status(400).json({ message: 'userId and reason are required' })
    }
    const report = await reportUser(req.user.id, userId, reason, details)
    return res.status(201).json({ report })
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Could not submit report' })
  }
})

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const result = await deleteUserAccount(req.user.id)
    return res.json(result)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not delete account' })
  }
})

export default router
