import express from 'express'
import { asyncHandler } from '../middleware/errors.js'
import { getPublicTasteCard } from '../services/growthService.js'
import { renderPng, tasteCardSvg } from '../services/shareCardService.js'
import { env } from '../config/env.js'

// Unauthenticated, read-only endpoints for shared links.
const router = express.Router()

router.get(
  '/taste/:code',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300')
    return res.json({ card: await getPublicTasteCard(req.params.code) })
  })
)

// Link-preview image for /taste/<code> (Open Graph, 1200×630).
router.get(
  '/taste/:code/card.png',
  asyncHandler(async (req, res) => {
    const card = await getPublicTasteCard(req.params.code)
    const host = env.APP_PUBLIC_URL ? new URL(env.APP_PUBLIC_URL).host : 'reelmates.app'
    res.set('Content-Type', 'image/png')
    res.set('Cache-Control', 'public, max-age=3600')
    return res.send(renderPng(tasteCardSvg(card, { host })))
  })
)

export default router
