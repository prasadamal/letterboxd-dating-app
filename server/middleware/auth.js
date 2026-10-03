import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signToken(payload) {
  // Short-lived: clients renew through /auth/refresh, so revoking refresh tokens ends a session within the hour.
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' })
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token', code: 'UNAUTHORIZED', requestId: req.requestId })
  }

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, env.JWT_SECRET)
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token expired or invalid', code: 'UNAUTHORIZED', requestId: req.requestId })
  }
}
