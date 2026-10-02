import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

export function applySecurityMiddleware(app) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  )

  app.disable('x-powered-by')

  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests', code: 'RATE_LIMITED' }
  })

  app.use('/api', globalLimiter)
}

export function authRateLimiter() {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many auth attempts', code: 'AUTH_RATE_LIMITED' }
  })
}
