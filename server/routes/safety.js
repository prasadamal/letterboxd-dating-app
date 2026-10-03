import express from 'express'
import { blockUser, deleteUserAccount, reportUser } from '../safetyService.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { validateBody, blockSchema, reportSchema } from '../middleware/validate.js'
import { writeAuditLog } from '../services/auditService.js'

const router = express.Router()

router.post(
  '/block',
  authMiddleware,
  validateBody(blockSchema),
  asyncHandler(async (req, res) => {
    const result = await blockUser(req.user.id, req.body.userId, req.body.reason)
    return res.json(result)
  })
)

router.post(
  '/report',
  authMiddleware,
  validateBody(reportSchema),
  asyncHandler(async (req, res) => {
    const { userId, reason, details, block } = req.body
    const report = await reportUser(req.user.id, userId, reason, details)
    // Reporting from a profile or chat usually means the reporter never wants to see that person again.
    if (block) await blockUser(req.user.id, userId, `report:${reason}`)
    return res.status(201).json({ report, blocked: Boolean(block) })
  })
)

router.delete(
  '/account',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await deleteUserAccount(req.user.id)
    await writeAuditLog({
      actorId: req.user.id,
      action: 'account.delete',
      resourceType: 'user',
      resourceId: req.user.id,
      ip: req.ip,
      requestId: req.requestId
    })
    return res.json(result)
  })
)

export default router
