import express from 'express'
import { env } from '../config/env.js'
import { sameSecret } from '../middleware/admin.js'
import { asyncHandler } from '../middleware/errors.js'
import { supabase } from '../supabaseClient.js'
import { plusUntilFromRevenueCat } from '../lib/plus.js'
import { writeAuditLog } from '../services/auditService.js'
import { logger } from '../lib/logger.js'

const router = express.Router()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// RevenueCat webhook. The app identifies purchasers with Purchases.logIn(user.id), so app_user_id is our user id.
router.post(
  '/revenuecat',
  asyncHandler(async (req, res) => {
    if (!env.REVENUECAT_WEBHOOK_AUTH) return res.status(503).json({ message: 'Billing not configured', code: 'BILLING_DISABLED' })
    if (!sameSecret(req.headers.authorization, env.REVENUECAT_WEBHOOK_AUTH)) {
      return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
    }

    const event = req.body?.event
    const userId = event?.app_user_id
    const plusUntil = plusUntilFromRevenueCat(event)
    // Anonymous ids ($RCAnonymousID:…) and events that don't change access are acknowledged and ignored.
    if (plusUntil === undefined || !UUID_RE.test(String(userId || ''))) return res.json({ ok: true, ignored: true })

    const { error } = await supabase.from('users').update({ plus_until: plusUntil }).eq('id', userId)
    if (error) throw error
    await writeAuditLog({
      actorId: userId,
      action: `billing.${String(event.type).toLowerCase()}`,
      resourceType: 'user',
      resourceId: userId,
      metadata: { productId: event.product_id || null, store: event.store || null, plusUntil },
      requestId: req.requestId
    }).catch((err) => logger.warn('billing audit skipped', { message: err.message }))
    return res.json({ ok: true })
  })
)

export default router
