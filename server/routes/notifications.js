import express from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { validateBody } from '../middleware/validate.js'
import { registerPushToken } from '../services/notificationService.js'

const router = express.Router()

const registerSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android', 'web'])
})

router.post(
  '/register',
  authMiddleware,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await registerPushToken(req.user.id, req.body.token, req.body.platform)
    return res.json(result)
  })
)

export default router
