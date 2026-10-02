import express from 'express'
import { getUserProfile, updateUserProfile, ensureUserProfile } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getUserProfile(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({ user: ensureUserProfile(user) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not load profile' })
  }
})

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, city, country, bio, hobbies, age, photoUrl } = req.body
    const updates = {}

    if (name) updates.display_name = name
    if (city !== undefined) updates.city = city
    if (country !== undefined) updates.country = country
    if (bio !== undefined) updates.bio = bio
    if (photoUrl !== undefined) updates.photo_url = photoUrl
    if (age !== undefined) updates.age = Number(age)
    if (hobbies) {
      updates.hobbies = Array.isArray(hobbies) ? hobbies : String(hobbies).split(',').map((item) => item.trim())
    }

    await updateUserProfile(req.user.id, updates)
    const user = await getUserProfile(req.user.id)
    return res.json({ user: ensureUserProfile(user) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Could not update profile' })
  }
})

export default router
