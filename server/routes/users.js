import express from 'express'
import { store, ensureUserProfile } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/profile', authMiddleware, (req, res) => {
  const user = store.users.find((item) => item.id === req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  return res.json({ user: ensureUserProfile(user) })
})

router.put('/profile', authMiddleware, (req, res) => {
  const user = store.users.find((item) => item.id === req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const { name, city, bio, hobbies } = req.body
  if (name) user.name = name
  if (city) user.city = city
  if (bio) user.bio = bio
  if (hobbies) user.hobbies = Array.isArray(hobbies) ? hobbies : String(hobbies).split(',').map((item) => item.trim())

  return res.json({ user: ensureUserProfile(user) })
})

export default router
