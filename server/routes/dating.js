import express from 'express'
import {
  applyReferralCode,
  getDatingDeckWithMeta,
  getLikesYou,
  getMutualMatches,
  getReferralInfo,
  recordSwipe,
  undoLastSwipe
} from '../datingService.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateBody, swipeSchema } from '../middleware/validate.js'

const router = express.Router()

router.get('/deck', authMiddleware, async (req, res) => {
  try {
    const { deck, meta } = await getDatingDeckWithMeta(req.user.id, 1)
    return res.json({ profile: deck[0] || null, meta })
  } catch (error) {
    if (['DATING_LOCKED', 'DATING_OFF', 'PROFILE_INCOMPLETE'].includes(error.code)) {
      return res.status(403).json({
        message: error.message,
        code: error.code,
        details: error.details || null
      })
    }
    console.error(error)
    return res.status(500).json({ message: 'Could not load dating deck' })
  }
})

router.post('/swipe', authMiddleware, validateBody(swipeSchema), async (req, res) => {
  try {
    const { targetId, action } = req.body
    const result = await recordSwipe(req.user.id, targetId, action)
    return res.json(result)
  } catch (error) {
    if (['DATING_LOCKED', 'DATING_OFF', 'PROFILE_INCOMPLETE'].includes(error.code)) {
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

router.post('/undo', authMiddleware, async (req, res) => {
  try {
    const result = await undoLastSwipe(req.user.id)
    return res.json(result)
  } catch (error) {
    if (['DATING_LOCKED', 'DATING_OFF', 'PROFILE_INCOMPLETE'].includes(error.code)) {
      return res.status(403).json({ message: error.message, code: error.code, details: error.details || null })
    }
    return res.status(400).json({ message: error.message || 'Could not undo swipe' })
  }
})

router.get('/matches', authMiddleware, async (req, res) => {
  try {
    const matches = await getMutualMatches(req.user.id)
    return res.json({ matches })
  } catch (error) {
    if (['DATING_LOCKED', 'DATING_OFF', 'PROFILE_INCOMPLETE'].includes(error.code)) {
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

// Count for everyone; full profiles with ReelMates Plus.
router.get('/likes-you', authMiddleware, async (req, res) => {
  try {
    return res.json(await getLikesYou(req.user.id))
  } catch (error) {
    if (error.code === 'DATING_LOCKED' || error.code === 'DATING_OFF') return res.status(403).json({ message: error.message, code: error.code })
    console.error(error)
    return res.status(500).json({ message: 'Could not load likes' })
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
