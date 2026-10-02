import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  createUser,
  ensureUserProfile,
  findUserByEmail,
  findUserById,
  getUserProfile
} from '../db.js'
import { signToken } from '../middleware/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

const router = express.Router()

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, age, city, bio, hobbies } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' })
    }

    if (await findUserByEmail(email)) {
      return res.status(409).json({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)
    const row = await createUser({
      email: String(email).trim().toLowerCase(),
      password_hash: passwordHash,
      display_name: name,
      age: Number(age || 25),
      city: city || '',
      bio: bio || 'I love movies and good conversation.',
      hobbies: Array.isArray(hobbies) ? hobbies : ['Cinema', 'Coffee', 'Travel']
    })

    const token = signToken({ id: row.id, email: row.email })
    const user = await getUserProfile(row.id)
    return res.status(201).json({ token, user: ensureUserProfile(user) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not create account' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await findUserByEmail(email)

    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signToken({ id: user.id, email: user.email })
    const profile = await getUserProfile(user.id)
    return res.json({ token, user: ensureUserProfile(profile) })
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
    return res.json({ user: ensureUserProfile(user) })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})

export default router
