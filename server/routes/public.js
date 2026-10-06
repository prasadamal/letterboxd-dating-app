import express from 'express'
import { asyncHandler } from '../middleware/errors.js'
import { getPublicTasteCard } from '../services/growthService.js'

// Unauthenticated, read-only endpoints for shared links.
const router = express.Router()

router.get(
  '/taste/:code',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300')
    return res.json({ card: await getPublicTasteCard(req.params.code) })
  })
)

export default router
