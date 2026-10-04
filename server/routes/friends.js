import express from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import { validateBody } from '../middleware/validate.js'
import { getReferralInfo } from '../datingService.js'
import { addFriendByCode, compareWith, listFriends, removeFriend } from '../services/friendsService.js'

const router = express.Router()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

router.param('userId', (req, res, next, value) => {
  if (!UUID_RE.test(value)) return next(new AppError('Not found', 404, 'NOT_FOUND'))
  next()
})

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [friends, referral] = await Promise.all([listFriends(req.user.id), getReferralInfo(req.user.id)])
    return res.json({ friends, myCode: referral.code })
  })
)

router.post(
  '/',
  authMiddleware,
  validateBody(z.object({ code: z.string().trim().min(4).max(32) })),
  asyncHandler(async (req, res) => {
    const result = await addFriendByCode(req.user.id, req.body.code)
    return res.status(201).json(result)
  })
)

router.delete(
  '/:userId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json(await removeFriend(req.user.id, req.params.userId))
  })
)

// Taste comparison + "watch together" ideas with a film friend or a dating match.
router.get(
  '/compare/:userId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json(await compareWith(req.user.id, req.params.userId))
  })
)

export default router
