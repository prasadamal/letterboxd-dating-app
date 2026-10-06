import crypto from 'crypto'
import { env } from '../config/env.js'

export function sameSecret(given, expected) {
  const a = Buffer.from(String(given || ''))
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function adminMiddleware(req, res, next) {
  const key = req.headers['x-admin-key']
  if (!env.ADMIN_API_KEY) {
    return res.status(503).json({ message: 'Admin API not configured', code: 'ADMIN_DISABLED' })
  }
  if (!sameSecret(key, env.ADMIN_API_KEY)) {
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
  }
  next()
}

export function cronMiddleware(req, res, next) {
  const key = req.headers['x-cron-secret']
  if (!env.CRON_SECRET) {
    return res.status(503).json({ message: 'Cron not configured', code: 'CRON_DISABLED' })
  }
  if (!sameSecret(key, env.CRON_SECRET)) {
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
  }
  next()
}
