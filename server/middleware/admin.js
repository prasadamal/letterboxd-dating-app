import { env } from '../config/env.js'

export function adminMiddleware(req, res, next) {
  const key = req.headers['x-admin-key']
  if (!env.ADMIN_API_KEY) {
    return res.status(503).json({ message: 'Admin API not configured', code: 'ADMIN_DISABLED' })
  }
  if (key !== env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
  }
  next()
}

export function cronMiddleware(req, res, next) {
  const key = req.headers['x-cron-secret']
  if (!env.CRON_SECRET) {
    return res.status(503).json({ message: 'Cron not configured', code: 'CRON_DISABLED' })
  }
  if (key !== env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' })
  }
  next()
}
