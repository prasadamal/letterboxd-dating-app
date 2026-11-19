import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { env } from '../config/env.js'

// Health checks (Render's probe, the keep-alive job, uptime monitors) are never rate limited.
const HEALTH_PATH = /^\/(v1\/)?health(\/|$)/

/**
 * Who a request counts against. Signed-in requests count against the account, not the network:
 * Indian mobile carriers put many customers behind one shared address, and one busy person on that
 * address must not lock out everyone else on it. Anonymous requests count against the address.
 */
export function rateLimitKey(req) {
  if (req.rateLimitKey) return req.rateLimitKey
  let key = `ip:${ipKeyGenerator(req.ip || '')}`
  const header = req.headers.authorization
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    try {
      const claims = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] })
      if (claims?.id) key = `user:${claims.id}`
    } catch {
      // An invalid or expired token counts like an anonymous request.
    }
  }
  req.rateLimitKey = key
  return key
}

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
    limit: (req) => (rateLimitKey(req).startsWith('user:') ? env.RATE_LIMIT_USER_MAX : env.RATE_LIMIT_MAX),
    keyGenerator: rateLimitKey,
    skip: (req) => HEALTH_PATH.test(req.path),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests', code: 'RATE_LIMITED' }
  })

  app.use('/api', globalLimiter)
}

const authMessage = { message: 'Too many attempts. Try again in a few minutes.', code: 'AUTH_RATE_LIMITED' }

/**
 * Sign-in style endpoints get two limits. A tight one per address and account (the email in the
 * body, or the signed-in user) stops password guessing against one account; a looser one per
 * address stops one machine from trying many accounts, while still letting many people who share
 * a mobile carrier's address sign in.
 */
export function authRateLimiter() {
  const perAccount = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_RATE_LIMIT_MAX,
    keyGenerator: (req) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : ''
      return email ? `ip:${ipKeyGenerator(req.ip || '')}|email:${email}` : rateLimitKey(req)
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: authMessage
  })
  const perAddress = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.AUTH_IP_RATE_LIMIT_MAX,
    keyGenerator: (req) => `ip:${ipKeyGenerator(req.ip || '')}`,
    standardHeaders: false,
    legacyHeaders: false,
    message: authMessage
  })
  return [perAccount, perAddress]
}
