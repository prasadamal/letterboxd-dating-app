import express from 'express'
import { getPlatformStatus, getPlatformStatusForUser } from '../platformService.js'
import { findUserById } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { API_VERSION, MIN_MOBILE_VERSION, RECOMMENDED_MOBILE_VERSION } from '../lib/version.js'

const router = express.Router()

router.get('/version', (req, res) => {
  return res.json({
    apiVersion: API_VERSION,
    minMobileVersion: MIN_MOBILE_VERSION,
    recommendedMobileVersion: RECOMMENDED_MOBILE_VERSION
  })
})

router.get('/status', async (req, res) => {
  try {
    const status = await getPlatformStatus()
    return res.json(status)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load platform status' })
  }
})

// Includes the member's country progress; dating may be open in their country before the global launch.
router.get('/status/me', authMiddleware, async (req, res) => {
  try {
    const status = await getPlatformStatusForUser(await findUserById(req.user.id), { includeMatches: true })
    return res.json(status)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load platform status' })
  }
})

export default router
