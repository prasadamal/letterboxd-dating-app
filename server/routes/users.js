import express from 'express'
import { findUserById, publicUser } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { validateProfileUpdate } from '../lib/validation.js'

const router = express.Router()

router.get('/profile', authMiddleware, (req, res) => {
  const user = findUserById(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  return res.json({ user: publicUser(user) })
})

// Partial update: only fields present in the body change; text fields (bio, city) may be cleared with "".
router.put('/profile', authMiddleware, (req, res) => {
  const user = findUserById(req.user.id)
  if (!user) return res.status(404).json({ message: 'User not found' })

  const parsed = validateProfileUpdate(req.body)
  if (parsed.error) return res.status(400).json({ message: parsed.error })

  Object.assign(user, parsed.value)
  return res.json({ user: publicUser(user) })
})

export default router
