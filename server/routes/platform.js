import express from 'express'
import { getPlatformStatus } from '../platformService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/status', async (req, res) => {
  try {
    const status = await getPlatformStatus()
    return res.json(status)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load platform status' })
  }
})

router.get('/status/me', authMiddleware, async (req, res) => {
  try {
    const status = await getPlatformStatus()
    return res.json(status)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load platform status' })
  }
})

export default router
