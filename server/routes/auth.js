import express from 'express'
import { store, ensureUserProfile, findUserByEmail, addUser } from '../db.js'
import jwt from 'jsonwebtoken'
import { signToken } from '../middleware/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

const router = express.Router()

router.post('/signup', (req, res) => {
  const { email, password, name, age, city, bio, hobbies } = req.body
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' })
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ message: 'User already exists' })
  }

  const newUser = {
    id: Date.now(),
    email,
    password,
    name,
    age: Number(age || 25),
    city: city || 'Unknown city',
    bio: bio || 'I love movies and good conversation.',
    hobbies: Array.isArray(hobbies) ? hobbies : ['Cinema', 'Coffee', 'Travel'],
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    loved: [],
    hated: []
  }

  addUser(newUser)
  const token = signToken({ id: newUser.id, email: newUser.email })
  return res.status(201).json({ token, user: ensureUserProfile(newUser) })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body
  const user = findUserByEmail(email)

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = signToken({ id: user.id, email: user.email })
  return res.json({ token, user: ensureUserProfile(user) })
})

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Missing token' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = store.users.find((item) => item.id === decoded.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({ user: ensureUserProfile(user) })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})

export default router
