import express from 'express'
import { getMutualMatches } from '../datingService.js'
import { getPlatformStatusForUser } from '../platformService.js'
import { findUserById } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const platform = await getPlatformStatusForUser(await findUserById(req.user.id))
    const matches = await getMutualMatches(req.user.id)
    return res.json({ matches, datingLaunched: platform.datingLaunched, platform })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load matches' })
  }
})

export default router
