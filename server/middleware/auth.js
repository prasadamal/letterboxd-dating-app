import jwt from 'jsonwebtoken'
import { findUserById } from '../db.js'
import { env } from '../config/env.js'

export function signToken(payload) {
  // authVersion invalidates already-issued access tokens immediately after a password reset.
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' })
}

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token', code: 'UNAUTHORIZED', requestId: req.requestId })
  }

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (!req.user.id) throw new Error('Missing identity')
  } catch (error) {
    return res.status(401).json({ message: 'Token expired or invalid', code: 'UNAUTHORIZED', requestId: req.requestId })
  }
  try {
    const account = await findUserById(req.user.id)
    if (!account || account.deleted_at || account.is_active === false ||
        (req.user.authVersion ?? 0) !== (account.auth_version ?? 0)) {
      return res.status(401).json({ message: 'Session ended', code: 'UNAUTHORIZED' })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}
