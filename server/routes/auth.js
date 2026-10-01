import express from 'express'
import { findUserByEmail, findUserById, addUser, publicUser } from '../db.js'
import { signToken, authMiddleware } from '../middleware/auth.js'
import { createRateLimiter } from '../middleware/rateLimit.js'
import { hashPassword, verifyPassword, verifyDummyPassword } from '../lib/security.js'
import { validateSignup, normalizeEmail } from '../lib/validation.js'

const router = express.Router()

// Brute-force protection: per-IP, per-process. Tunable via env for deployments/tests.
const authLimiter = createRateLimiter({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20)
})

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80'

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const parsed = validateSignup(req.body)
    if (parsed.error) return res.status(400).json({ message: parsed.error })
    const { password, ...profile } = parsed.value

    if (findUserByEmail(profile.email)) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const password_hash = await hashPassword(password)
    // Re-check after the async hash so two concurrent signups cannot both win.
    if (findUserByEmail(profile.email)) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const newUser = addUser({ ...profile, password_hash, avatar_url: DEFAULT_AVATAR, loved: [], hated: [] })
    const token = signToken({ id: newUser.id, email: newUser.email })
    return res.status(201).json({ token, user: publicUser(newUser) })
  } catch (error) {
    return next(error)
  }
})

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const password = req.body?.password
    if (!email || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = findUserByEmail(email)
    const ok = user ? await verifyPassword(password, user.password_hash) : await verifyDummyPassword(password)
    if (!user || !ok) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken({ id: user.id, email: user.email })
    return res.json({ token, user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', authMiddleware, (req, res) => {
  const user = findUserById(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  return res.json({ user: publicUser(user) })
})

export default router
