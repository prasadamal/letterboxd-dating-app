import express from 'express'
import { z } from 'zod'
import { getUserProfile, updateUserProfile, ensureUserProfile, findUserById } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import { validateBody } from '../middleware/validate.js'
import { uploadAvatar } from '../services/storageService.js'
import { computeProfileCompletion, writeAuditLog } from '../services/auditService.js'
import { saveProfilePhotoRecord, syncProfileCompletion } from '../services/profileService.js'
import { setUserVerification } from '../services/verificationService.js'

const router = express.Router()

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  city: z.string().max(80).optional(),
  country: z.string().min(2).max(80).optional(),
  bio: z.string().max(280).optional(),
  age: z.coerce.number().int().min(18).max(100).optional(),
  photoUrl: z.string().url().optional(),
  hobbies: z.array(z.string()).optional(),
  discoveryPrefs: z
    .object({
      minAge: z.number().int().min(18).max(100).optional(),
      maxAge: z.number().int().min(18).max(100).optional(),
      countries: z.array(z.string()).optional()
    })
    .optional()
})

const avatarSchema = z.object({
  imageBase64: z.string().min(20),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'])
})

router.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await getUserProfile(req.user.id)
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    return res.json({ user: ensureUserProfile(user) })
  })
)

router.put(
  '/profile',
  authMiddleware,
  validateBody(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const { name, city, country, bio, hobbies, age, photoUrl, discoveryPrefs } = req.body
    const updates = {}

    if (name) updates.display_name = name
    if (city !== undefined) updates.city = city
    if (country !== undefined) updates.country = country
    if (bio !== undefined) updates.bio = bio
    if (photoUrl !== undefined) updates.photo_url = photoUrl
    if (age !== undefined) updates.age = age
    if (hobbies) updates.hobbies = hobbies
    if (discoveryPrefs) updates.discovery_prefs = discoveryPrefs
    updates.last_active_at = new Date().toISOString()

    const row = await updateUserProfile(req.user.id, updates)
    updates.profile_completion = computeProfileCompletion({ ...row, ...updates })
    await updateUserProfile(req.user.id, { profile_completion: updates.profile_completion })

    const user = await getUserProfile(req.user.id)
    return res.json({ user: ensureUserProfile(user) })
  })
)

router.post(
  '/avatar',
  authMiddleware,
  validateBody(avatarSchema),
  asyncHandler(async (req, res) => {
    const buffer = Buffer.from(req.body.imageBase64, 'base64')
    if (buffer.length > 2_500_000) throw new AppError('Image too large (max 2.5MB)', 400, 'FILE_TOO_LARGE')

    const publicUrl = await uploadAvatar(req.user.id, buffer, req.body.contentType)
    const state = await saveProfilePhotoRecord(req.user.id, publicUrl, true)

    await writeAuditLog({
      actorId: req.user.id,
      action: 'profile.avatar_upload',
      resourceType: 'user',
      resourceId: req.user.id,
      requestId: req.requestId
    })

    const user = await getUserProfile(req.user.id)
    return res.json({ user: ensureUserProfile(user), photoUrl: publicUrl, profile: state })
  })
)

router.get(
  '/profile/completeness',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await getUserProfile(req.user.id)
    const completion = user?.profile_completion ?? 0
    const missing = []
    if (completion < 100) {
      if (!user.photo_url) missing.push('photo')
      if (!user.bio) missing.push('bio')
      if (!user.country) missing.push('country')
      if (!user.email_verified) missing.push('email_verification')
    }
    return res.json({ completion, complete: completion >= 80, missing })
  })
)

const verificationRequestSchema = z.object({
  notes: z.string().max(500).optional()
})

router.post(
  '/verification/request',
  authMiddleware,
  validateBody(verificationRequestSchema),
  asyncHandler(async (req, res) => {
    const user = await setUserVerification(req.user.id, 'pending', req.body.notes || 'User requested verification')
    return res.json({ user })
  })
)

export default router
