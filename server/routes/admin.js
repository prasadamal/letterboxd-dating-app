import express from 'express'
import { adminMiddleware } from '../middleware/admin.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import { listModerationQueue, setUserSuspended, updateModerationItem } from '../services/moderationService.js'
import { setUserVerification } from '../services/verificationService.js'
import { validateBody } from '../middleware/validate.js'
import { z } from 'zod'
import { writeAuditLog } from '../services/auditService.js'
import { getAdminPlatform, updatePlatformSettings } from '../platformService.js'
import { supabase } from '../supabaseClient.js'

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

router.get(
  '/platform',
  asyncHandler(async (req, res) => {
    return res.json({ platform: await getAdminPlatform() })
  })
)

const platformSchema = z
  .object({
    // Open or close dating everywhere at once (app-store reviewers, testing).
    datingOpen: z.boolean().optional(),
    // City launch: women AND men needed to open a city on its own, and cities opened by hand ("Kochi" or "Kochi, India").
    cityTarget: z.number().int().min(1).max(1_000_000).optional(),
    openCities: z.array(z.string().min(2).max(120)).max(500).optional()
  })
  .refine((body) => Object.keys(body).length > 0, 'Send at least one setting')

router.patch(
  '/platform',
  validateBody(platformSchema),
  asyncHandler(async (req, res) => {
    const platform = await updatePlatformSettings(req.body)
    await writeAuditLog({
      action: 'admin.platform_update',
      resourceType: 'platform_settings',
      resourceId: '1',
      metadata: req.body,
      requestId: req.requestId
    })
    return res.json({ platform })
  })
)

// Give or remove ReelMates Plus by hand (testers, support, giveaways). days: null ends it now.
router.patch(
  '/users/:userId/plus',
  validateBody(z.object({ days: z.number().int().min(1).max(3650).nullable() })),
  asyncHandler(async (req, res) => {
    if (!z.string().uuid().safeParse(req.params.userId).success) throw new AppError('User not found', 404, 'NOT_FOUND')
    const plusUntil = req.body.days ? new Date(Date.now() + req.body.days * 86_400_000).toISOString() : null
    const { data, error } = await supabase
      .from('users')
      .update({ plus_until: plusUntil })
      .eq('id', req.params.userId)
      .select('id, plus_until')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new AppError('User not found', 404, 'NOT_FOUND')
    await writeAuditLog({
      action: 'admin.plus_update',
      resourceType: 'user',
      resourceId: req.params.userId,
      metadata: { days: req.body.days },
      requestId: req.requestId
    })
    return res.json({ user: data })
  })
)

router.get(
  '/feedback',
  asyncHandler(async (req, res) => {
    const status = ['new', 'read', 'done'].includes(req.query.status) ? req.query.status : 'new'
    const { data, error } = await supabase
      .from('feedback')
      .select('id, category, message, app_version, platform, status, created_at')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return res.json({ items: data || [] })
  })
)

router.patch(
  '/feedback/:id',
  validateBody(z.object({ status: z.enum(['new', 'read', 'done']) })),
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from('feedback').update({ status: req.body.status }).eq('id', Number(req.params.id))
    if (error) throw error
    return res.json({ ok: true })
  })
)

export default router
