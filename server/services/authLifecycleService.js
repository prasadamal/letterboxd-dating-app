import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { supabase } from '../supabaseClient.js'
import { findUserByEmail, findUserById, updateUserProfile } from '../db.js'
import { createAuthToken, consumeAuthToken, sendEmail } from './auditService.js'
import { env } from '../config/env.js'

export async function requestPasswordReset(email) {
  const user = await findUserByEmail(email)
  if (!user || user.deleted_at) {
    return { ok: true }
  }

  const { token } = await createAuthToken(user.id, 'password_reset', 30)
  const link = `${env.APP_PUBLIC_URL || 'http://localhost:3000'}/reset-password?token=${token}`

  const sent = await sendEmail({
    to: user.email,
    subject: 'Reset your ReelMates password',
    html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>Link expires in 30 minutes.</p>`
  })

  return { ok: true, devResetUrl: sent.queued ? undefined : link }
}

export async function resetPassword(token, password) {
  const hash = await bcrypt.hash(password, 10)
  // Consume the link, change the password and invalidate sessions in one database transaction.
  const { data, error } = await supabase.rpc('reset_password_with_token', {
    p_token_hash: crypto.createHash('sha256').update(token).digest('hex'),
    p_password_hash: hash
  })
  if (error) throw error
  if (!data) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400, code: 'INVALID_TOKEN' })
  return { ok: true }
}

export async function requestEmailVerification(userId) {
  const user = await findUserById(userId)
  if (!user || user.deleted_at) throw Object.assign(new Error('User not found'), { status: 404 })

  if (user.email_verified_at) return { ok: true, alreadyVerified: true }

  const { token } = await createAuthToken(user.id, 'email_verify', 60 * 24)
  const link = `${env.APP_PUBLIC_URL || 'http://localhost:3000'}/verify-email?token=${token}`

  const sent = await sendEmail({
    to: user.email,
    subject: 'Verify your ReelMates email',
    html: `<p>Verify your email:</p><p><a href="${link}">${link}</a></p>`
  })

  return { ok: true, devVerifyUrl: sent.queued ? undefined : link }
}

export async function verifyEmail(token) {
  const row = await consumeAuthToken(token, 'email_verify')
  if (!row) throw Object.assign(new Error('Invalid or expired verification token'), { status: 400, code: 'INVALID_TOKEN' })

  await updateUserProfile(row.user_id, { email_verified_at: new Date().toISOString() })
  return { ok: true }
}
