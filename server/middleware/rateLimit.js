/**
 * Minimal in-memory fixed-window rate limiter keyed by client IP.
 * Good enough for a single process; use a shared store (Redis) if you scale out.
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many attempts, please try again later.' } = {}) {
  const hits = new Map()

  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
  }, Math.max(windowMs, 1000))
  sweep.unref()

  return function rateLimit(req, res, next) {
    const now = Date.now()
    const key = req.ip || req.socket?.remoteAddress || 'unknown'
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1

    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)))
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return res.status(429).json({ message })
    }
    return next()
  }
}
