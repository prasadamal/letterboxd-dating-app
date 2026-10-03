import crypto from 'crypto'
import { supabase } from '../supabaseClient.js'
import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function writeAuditLog({ actorId, action, resourceType, resourceId, metadata, ip, requestId }) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId || null,
      action,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      metadata: metadata || {},
      ip: ip || null,
      request_id: requestId || null
    })
  } catch (error) {
    logger.warn('Audit log write failed', { error: error.message, action })
  }
}

export async function createAuthToken(userId, purpose, ttlMinutes = 60) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()

  const { error } = await supabase.from('auth_tokens').insert({
    user_id: userId,
    purpose,
    token_hash: hashToken(token),
    expires_at: expiresAt
  })

  if (error) throw error
  return { token, expiresAt }
}

export async function consumeAuthToken(token, purpose) {
  const tokenHash = hashToken(token)
  const { data, error } = await supabase
    .from('auth_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  await supabase.from('auth_tokens').update({ consumed_at: new Date().toISOString() }).eq('id', data.id)
  return data
}

export async function sendEmail({ to, subject, html }) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    logger.info('Email skipped (provider not configured)', { to, subject, preview: html.slice(0, 120) })
    return { queued: false, devMode: true }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html })
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Email send failed: ${body}`)
  }

  return { queued: true }
}

export function computeProfileCompletion(user) {
  let score = 0
  if (user?.display_name) score += 20
  if (user?.bio) score += 20
  if (user?.country) score += 15
  if (user?.photo_url) score += 25
  if (user?.email_verified_at) score += 20
  return Math.min(100, score)
}
