import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { createUser, ensureUserProfile, findUserByEmail, findUserById, getUserProfile, updateUserProfile } from '../db.js'
import { signToken, authMiddleware } from '../middleware/auth.js'
import { getPlatformStatusForUser } from '../platformService.js'
import { applyReferralCode } from '../datingService.js'
import { addFriendByCode } from '../services/friendsService.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import {
  validateBody,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../middleware/validate.js'
import { env } from '../config/env.js'
import { writeAuditLog, computeProfileCompletion } from '../services/auditService.js'
import {
  requestPasswordReset,
  resetPassword,
  requestEmailVerification,
  verifyEmail
} from '../services/authLifecycleService.js'
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../services/authService.js'
import { syncProfileCompletion } from '../services/profileService.js'
import { authRateLimiter } from '../middleware/security.js'
import { unregisterPushToken } from '../services/notificationService.js'
import { containsBlockedContent } from '../lib/contentFilter.js'
import { normalizeInterestedIn } from '../lib/datingEligibility.js'

const router = express.Router()

// Strict limit on endpoints that take credentials or send email; session endpoints use the global limit.
const credentialLimiter = authRateLimiter()

function referralCodeFromEmail(email) {
  return `REEL${crypto.createHash('sha1').update(String(email)).digest('hex').slice(0, 6).toUpperCase()}`
}

router.post(
  '/signup',
  credentialLimiter,
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name, age, country, city, bio, gender, interestedIn, datingEnabled, referralCode } = req.body
    if ([name, bio, city, country].some(containsBlockedContent)) {
      throw new AppError('Your profile text breaks our community rules.', 422, 'CONTENT_BLOCKED')
    }

    if (await findUserByEmail(email)) {
      throw new AppError('User already exists', 409, 'USER_EXISTS')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const row = await createUser({
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      display_name: name,
      age,
      country,
      city: city || country,
      bio: bio || 'Connecting through the world of movies.',
      hobbies: ['Cinema'],
      gender,
      interested_in: normalizeInterestedIn(interestedIn, gender),
      // Older app versions don't send it; they were dating-only, so default to on.
      dating_enabled: datingEnabled ?? true,
      terms_accepted_at: new Date().toISOString(),
      referral_code: referralCodeFromEmail(email),
      last_active_at: new Date().toISOString()
    })

    // The code of whoever invited you: credits the referral and makes you film friends straight away,
    // so a new member sees their match % with the friend who brought them.
    if (referralCode) {
      await applyReferralCode(row.id, referralCode).catch(() => null)
      await addFriendByCode(row.id, referralCode).catch(() => null)
    }

    await updateUserProfile(row.id, { profile_completion: computeProfileCompletion(row) })

    await writeAuditLog({
      actorId: row.id,
      action: 'auth.signup',
      resourceType: 'user',
      resourceId: row.id,
      ip: req.ip,
      requestId: req.requestId
    })

    const token = signToken({ id: row.id, email: row.email })
    const { refreshToken, expiresAt } = await issueRefreshToken(row.id)
    await syncProfileCompletion(row.id)
    const user = await getUserProfile(row.id)
    const platform = await getPlatformStatusForUser(row)
    return res.status(201).json({ token, refreshToken, refreshExpiresAt: expiresAt, user: ensureUserProfile(user), platform })
  })
)

router.post(
  '/login',
  credentialLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await findUserByEmail(email)

    if (!user || user.deleted_at || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }
    if (user.is_active === false) {
      throw new AppError('This account has been suspended. Contact support@reelmates.app.', 403, 'ACCOUNT_SUSPENDED')
    }

    await updateUserProfile(user.id, { last_active_at: new Date().toISOString() })

    const token = signToken({ id: user.id, email: user.email })
    const { refreshToken, expiresAt } = await issueRefreshToken(user.id)
    await syncProfileCompletion(user.id)
    const profile = await getUserProfile(user.id)
    const platform = await getPlatformStatusForUser(user)
    return res.json({ token, refreshToken, refreshExpiresAt: expiresAt, user: ensureUserProfile(profile), platform })
  })
)

router.post('/forgot-password', credentialLimiter, validateBody(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body.email)
  const body = { ok: true, message: 'If that email exists, a reset link was sent.' }
  if (env.NODE_ENV !== 'production' && result.devResetUrl) body.devResetUrl = result.devResetUrl
  return res.json(body)
}))

router.post('/reset-password', credentialLimiter, validateBody(resetPasswordSchema), asyncHandler(async (req, res) => {
  try {
    await resetPassword(req.body.token, req.body.password)
  } catch (error) {
    throw new AppError(error.message, error.status || 400, error.code || 'RESET_FAILED')
  }
  return res.json({ ok: true })
}))

router.post('/verify-email/request', credentialLimiter, authMiddleware, asyncHandler(async (req, res) => {
  const result = await requestEmailVerification(req.user.id)
  const body = { ok: true, alreadyVerified: Boolean(result.alreadyVerified) }
  if (env.NODE_ENV !== 'production' && result.devVerifyUrl) body.devVerifyUrl = result.devVerifyUrl
  return res.json(body)
}))

router.post('/verify-email/confirm', credentialLimiter, validateBody(verifyEmailSchema), asyncHandler(async (req, res) => {
  try {
    await verifyEmail(req.body.token)
  } catch (error) {
    throw new AppError(error.message, error.status || 400, error.code || 'VERIFY_FAILED')
  }
  return res.json({ ok: true })
}))

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) throw new AppError('refreshToken required', 400, 'VALIDATION_ERROR')

  const rotated = await rotateRefreshToken(refreshToken)
  if (!rotated) throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH')

  const account = await findUserById(rotated.userId)
  if (!account || account.deleted_at || account.is_active === false) {
    throw new AppError('Session ended', 401, 'INVALID_REFRESH')
  }
  const profile = await getUserProfile(rotated.userId)
  const token = signToken({ id: rotated.userId, email: profile.email })
  return res.json({
    token,
    refreshToken: rotated.refreshToken,
    refreshExpiresAt: rotated.expiresAt,
    user: ensureUserProfile(profile)
  })
}))

router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken, pushToken } = req.body
  if (refreshToken) await revokeRefreshToken(refreshToken)
  // The next person to sign in on this device must not get the previous user's notifications.
  if (typeof pushToken === 'string' && /^Expo(nent)?PushToken\[/.test(pushToken)) await unregisterPushToken(pushToken)
  return res.json({ ok: true })
}))

router.get('/me', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new AppError('Missing token', 401, 'UNAUTHORIZED')

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    const user = await getUserProfile(decoded.id)
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    const platform = await getPlatformStatusForUser(user, { includeMatches: true })
    return res.json({ user: ensureUserProfile(user), platform })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Invalid token', 401, 'UNAUTHORIZED')
  }
}))

export default router
