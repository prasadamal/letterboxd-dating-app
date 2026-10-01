import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../config.js'
import { findUserById } from '../db.js'

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d', algorithm: 'HS256' })
}

/** Verifies the Bearer token (signature + expiry) and that the user still exists. */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' })
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], getJwtSecret(), { algorithms: ['HS256'] })
    const user = findUserById(payload.id)
    if (!user) return res.status(401).json({ message: 'Token expired or invalid' })
    req.user = { id: user.id, email: user.email }
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Token expired or invalid' })
  }
}
