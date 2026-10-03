import express from 'express'
import { adminMiddleware } from '../middleware/admin.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import { listModerationQueue, setUserSuspended, updateModerationItem } from '../services/moderationService.js'
import { setUserVerification } from '../services/verificationService.js'
import { validateBody } from '../middleware/validate.js'
import { z } from 'zod'
import { writeAuditLog } from '../services/auditService.js'

const router = express.Router()

router.use(adminMiddleware)

router.get(
  '/moderation/queue',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'open'
    const items = await listModerationQueue(status)
    return res.json({ items })
  })
)

const statusSchema = z.object({ status: z.enum(['open', 'reviewing', 'resolved', 'dismissed']) })

router.patch(
  '/moderation/:id',
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const item = await updateModerationItem(Number(req.params.id), req.body.status)
    return res.json({ item })
  })
)

const verificationSchema = z.object({
  status: z.enum(['unverified', 'pending', 'verified', 'rejected']),
  notes: z.string().max(500).optional()
})

router.patch(
  '/users/:userId/verification',
  validateBody(verificationSchema),
  asyncHandler(async (req, res) => {
    const user = await setUserVerification(req.params.userId, req.body.status, req.body.notes)
    return res.json({ user })
  })
)

const suspendSchema = z.object({ suspended: z.boolean(), reason: z.string().max(500).optional() })

router.patch(
  '/users/:userId/suspension',
  validateBody(suspendSchema),
  asyncHandler(async (req, res) => {
    const user = await setUserSuspended(req.params.userId, req.body.suspended)
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    await writeAuditLog({
      action: req.body.suspended ? 'admin.user_suspend' : 'admin.user_unsuspend',
      resourceType: 'user',
      resourceId: req.params.userId,
      metadata: { reason: req.body.reason || null },
      requestId: req.requestId
    })
    return res.json({ user })
  })
)

export default router
