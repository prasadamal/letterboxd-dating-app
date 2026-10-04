import express from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { validateBody } from '../middleware/validate.js'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

const feedbackSchema = z.object({
  category: z.enum(['bug', 'idea', 'film', 'other']),
  message: z.string().trim().min(3).max(2000),
  appVersion: z.string().max(32).optional(),
  platform: z.enum(['ios', 'android', 'web']).optional()
})

router.post(
  '/',
  authMiddleware,
  validateBody(feedbackSchema),
  asyncHandler(async (req, res) => {
    const { category, message, appVersion, platform } = req.body
    const { error } = await supabase.from('feedback').insert({
      user_id: req.user.id,
      category,
      message,
      app_version: appVersion || null,
      platform: platform || null
    })
    if (error) throw error
    return res.status(201).json({ ok: true })
  })
)

export default router
