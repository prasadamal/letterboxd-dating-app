import express from 'express'
import { z } from 'zod'
import { getUserProfile, updateUserProfile, ensureUserProfile, findUserById } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errors.js'
import { countryField, validateBody } from '../middleware/validate.js'
import { containsBlockedContent } from '../lib/contentFilter.js'
import { detectImageType, uploadAvatar } from '../services/storageService.js'
import { writeAuditLog } from '../services/auditService.js'
import { saveProfilePhotoRecord, syncProfileCompletion } from '../services/profileService.js'
import { getTasteStats } from '../services/filmService.js'
import { setTasteCardPublic } from '../services/growthService.js'
import { supabase } from '../supabaseClient.js'
import { normalizeInterestedIn } from '../lib/datingEligibility.js'
import { canonicalCity } from '../lib/cityLaunch.js'
import { MAX_PROMPT_ANSWER, MAX_PROMPTS, PROFILE_PROMPTS, normalizePrompts } from '../lib/profilePrompts.js'

const router = express.Router()

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  city: z.string().max(80).optional(),
  country: countryField.optional(),
  bio: z.string().max(280).optional(),
  age: z.coerce.number().int().min(18).max(100).optional(),
  hobbies: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female', 'nonbinary']).optional(),
  datingEnabled: z.boolean().optional(),
  interestedIn: z.array(z.enum(['male', 'female', 'nonbinary'])).min(1).max(3).optional(),
  prompts: z
    .array(z.object({ key: z.enum(Object.keys(PROFILE_PROMPTS)), answer: z.string().max(MAX_PROMPT_ANSWER) }))
    .max(MAX_PROMPTS)
    .optional(),
  discoveryPrefs: z
    .object({
      minAge: z.number().int().min(18).max(100).optional(),
      maxAge: z.number().int().min(18).max(100).optional(),
      countries: z.array(z.string()).optional(),
      // ReelMates Plus: only show people at or above this taste match (ignored without Plus).
      minScore: z.number().int().min(0).max(95).optional(),
      // Who to meet: people in my city, or in every open city in my country (both people must agree).
      area: z.enum(['city', 'country']).optional()
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
    const { name, city, country, bio, hobbies, age, discoveryPrefs, gender, interestedIn, prompts, datingEnabled } = req.body
    const promptAnswers = (prompts || []).map((p) => p.answer)
    if ([name, bio, city, country, ...promptAnswers].some(containsBlockedContent)) {
      throw new AppError('Your profile text breaks our community rules.', 422, 'CONTENT_BLOCKED')
    }
    const updates = {}

    if (name) updates.display_name = name
    if (city !== undefined) updates.city = canonicalCity(city)
    if (country !== undefined) updates.country = country
    if (bio !== undefined) updates.bio = bio
    if (age !== undefined) updates.age = age
    if (hobbies) updates.hobbies = hobbies
    const current = discoveryPrefs || datingEnabled === true || interestedIn || gender ? await findUserById(req.user.id) : null
    // Merge so a partial update (e.g. only `area`) keeps the age range and the rest.
    if (discoveryPrefs) updates.discovery_prefs = { ...(current?.discovery_prefs || {}), ...discoveryPrefs }
    if (gender) updates.gender = gender
    if (interestedIn || gender) {
      updates.interested_in = normalizeInterestedIn(interestedIn || current?.interested_in, gender || current?.gender)
    }
    if (prompts) updates.prompts = normalizePrompts(prompts)
    if (datingEnabled !== undefined) updates.dating_enabled = datingEnabled
    if (datingEnabled === true && !gender && !current?.gender) {
      throw new AppError('Choose how you identify before turning on dating.', 400, 'GENDER_REQUIRED')
    }
    // Dating opens city by city, so daters need one.
    if (datingEnabled === true && !canonicalCity(city ?? current?.city)) {
      throw new AppError('Add your city before turning on dating.', 400, 'CITY_REQUIRED')
    }
    updates.last_active_at = new Date().toISOString()

    const row = await updateUserProfile(req.user.id, updates)
    const state = await syncProfileCompletion(req.user.id)

    const user = await getUserProfile(req.user.id)
    return res.json({ user: ensureUserProfile(user), profile: state })
  })
)

router.post(
  '/avatar',
  authMiddleware,
  validateBody(avatarSchema),
  asyncHandler(async (req, res) => {
    const buffer = Buffer.from(req.body.imageBase64, 'base64')
    if (buffer.length > 2_500_000) throw new AppError('Image too large (max 2.5MB)', 400, 'FILE_TOO_LARGE')

    const detected = detectImageType(buffer)
    if (!detected) throw new AppError('Upload a JPEG, PNG or WebP photo', 400, 'INVALID_IMAGE')

    const publicUrl = await uploadAvatar(req.user.id, buffer, detected)
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

// One all-time favourite film (or null to clear). Used in matching and shown on profile cards.
const favoriteSchema = z.object({ movieId: z.number().int().positive().nullable() })

router.put(
  '/favorite',
  authMiddleware,
  validateBody(favoriteSchema),
  asyncHandler(async (req, res) => {
    const { movieId } = req.body
    if (movieId !== null) {
      const { data: movie, error } = await supabase.from('movies').select('id').eq('id', movieId).maybeSingle()
      if (error) throw error
      if (!movie) throw new AppError('Film not found', 404, 'NOT_FOUND')
    }
    await updateUserProfile(req.user.id, { favorite_movie_id: movieId, last_active_at: new Date().toISOString() })
    const user = await getUserProfile(req.user.id)
    return res.json({ user: ensureUserProfile(user) })
  })
)

router.get(
  '/taste-stats',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json({ stats: await getTasteStats(req.user.id) })
  })
)

// Turns the public taste card (/taste/<friend code>) on or off.
router.put(
  '/taste-card',
  authMiddleware,
  validateBody(z.object({ public: z.boolean() })),
  asyncHandler(async (req, res) => {
    return res.json(await setTasteCardPublic(req.user.id, req.body.public))
  })
)

export default router
