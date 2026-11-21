import express from 'express'
import jwt from 'jsonwebtoken'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { env } from '../config/env.js'
import { asyncHandler } from '../middleware/errors.js'
import { getPublicTasteCard } from '../services/growthService.js'
import { answerChallenge, getPublicChallenge } from '../services/challengeService.js'

// Unauthenticated, read-only endpoints for shared links.
const router = express.Router()

router.get(
  '/taste/:code',
  asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=300')
    return res.json({ card: await getPublicTasteCard(req.params.code) })
  })
)

// Answering a challenge needs no account, so each address gets a modest allowance.
const answerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `challenge:${ipKeyGenerator(req.ip || '')}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many answers from here. Try again in a few minutes.', code: 'RATE_LIMITED' }
})

// A signed-in viewer is remembered on their answer (and can't answer their own challenge); anyone else
// answers anonymously. An invalid token is simply ignored here.
function optionalViewer(req) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] })?.id || null
  } catch {
    return null
  }
}

router.get(
  '/challenges/:code',
  asyncHandler(async (req, res) => res.json({ challenge: await getPublicChallenge(req.params.code) }))
)

router.post(
  '/challenges/:code/answers',
  answerLimiter,
  asyncHandler(async (req, res) => {
    const { name, answers } = req.body || {}
    const result = await answerChallenge(req.params.code, { name, answers }, optionalViewer(req))
    return res.status(201).json({ result })
  })
)

export default router
