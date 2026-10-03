import express from 'express'
import {
  applyReferralCode,
  getDatingDeck,
  getMutualMatches,
  getReferralInfo,
  recordSwipe
} from '../datingService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/deck', authMiddleware, async (req, res) => {
  try {
    const deck = await getDatingDeck(req.user.id, 1)
    return res.json({ profile: deck[0] || null })
  } catch (error) {
    if (error.code === 'DATING_LOCKED' || error.code === 'PROFILE_INCOMPLETE') {
      return res.status(403).json({
        message: error.message,
        code: error.code,
        details: error.details || null
      })
    }
    console.error(error)
    return res.status(500).json({ message: error.message || 'Could not load dating deck' })
  }
})

router.post('/swipe', authMiddleware, async (req, res) => {
  try {
    const { targetId, action } = req.body
    if (!targetId || !action) {
      return res.status(400).json({ message: 'targetId and action are required' })
    }
    const result = await recordSwipe(req.user.id, targetId, action)
    return res.json(result)
  } catch (error) {
    if (error.code === 'DATING_LOCKED' || error.code === 'PROFILE_INCOMPLETE') {
      return res.status(403).json({
        message: error.message,
        code: error.code,
        details: error.details || null
      })
    }
    console.error(error)
    return res.status(400).json({ message: error.message || 'Could not save swipe' })
  }
})

router.get('/matches', authMiddleware, async (req, res) => {
  try {
    const matches = await getMutualMatches(req.user.id)
    return res.json({ matches })
  } catch (error) {
    if (error.code === 'DATING_LOCKED' || error.code === 'PROFILE_INCOMPLETE') {
      return res.status(403).json({
        message: error.message,
        code: error.code,
        details: error.details || null
      })
    }
    console.error(error)
    return res.status(500).json({ message: 'Could not load matches' })
  }
})

router.get('/referral', authMiddleware, async (req, res) => {
  try {
    const referral = await getReferralInfo(req.user.id)
    return res.json(referral)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load referral info' })
  }
})

router.post('/referral/apply', authMiddleware, async (req, res) => {
  try {
    const result = await applyReferralCode(req.user.id, req.body.code)
    return res.json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid referral code' })
  }
})

export default router
