import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import {
  createUser,
  ensureUserProfile,
  findUserByEmail,
  getUserProfile
} from '../db.js'
import { signToken } from '../middleware/auth.js'
import { getPlatformStatus } from '../platformService.js'
import { applyReferralCode } from '../datingService.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

const router = express.Router()

function referralCodeFromEmail(email) {
  return `REEL${crypto.createHash('sha1').update(String(email)).digest('hex').slice(0, 6).toUpperCase()}`
}

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, age, country, bio, gender, termsAccepted, referralCode } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' })
    }
    if (!country) return res.status(400).json({ message: 'Country is required' })
    if (!gender || !['male', 'female'].includes(String(gender))) {
      return res.status(400).json({ message: 'Gender (male or female) is required for launch balance' })
    }
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the Terms of Service and Privacy Policy' })
    }

    const numericAge = Number(age || 25)
    if (numericAge < 18) {
      return res.status(400).json({ message: 'You must be at least 18 years old' })
    }

    if (await findUserByEmail(email)) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const row = await createUser({
      email: String(email).trim().toLowerCase(),
      password_hash: passwordHash,
      display_name: name,
      age: numericAge,
      country: String(country).trim(),
      city: String(country).trim(),
      bio: bio || 'Connecting through the world of movies.',
      hobbies: ['Cinema'],
      gender,
      terms_accepted_at: new Date().toISOString(),
      referral_code: referralCodeFromEmail(email)
    })

    if (referralCode) {
      try {
        await applyReferralCode(row.id, referralCode)
      } catch {
        // optional referral — ignore invalid codes at signup
      }
    }

    const token = signToken({ id: row.id, email: row.email })
    const user = await getUserProfile(row.id)
    const platform = await getPlatformStatus()
    return res.status(201).json({ token, user: ensureUserProfile(user), platform })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not create account' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await findUserByEmail(email)

    if (!user || user.deleted_at || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken({ id: user.id, email: user.email })
    const profile = await getUserProfile(user.id)
    const platform = await getPlatformStatus()
    return res.json({ token, user: ensureUserProfile(profile), platform })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Login failed' })
  }
})

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Missing token' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await getUserProfile(decoded.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const platform = await getPlatformStatus()
    return res.json({ user: ensureUserProfile(user), platform })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})

export default router
