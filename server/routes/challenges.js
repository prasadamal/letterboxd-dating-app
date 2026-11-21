import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createChallenge, getMyChallenge } from '../services/challengeService.js'

// The signed-in side of taste challenges. Opening and answering one is public (routes/public.js).
const router = express.Router()

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => res.status(201).json({ challenge: await createChallenge(req.user.id) }))
)

router.get(
  '/today',
  authMiddleware,
  asyncHandler(async (req, res) => res.json(await getMyChallenge(req.user.id)))
)

export default router
