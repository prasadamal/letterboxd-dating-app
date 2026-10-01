import 'dotenv/config'
import crypto from 'node:crypto'

// Secrets that ship in the repo/docs and therefore must never be used in production.
const KNOWN_DEFAULT_SECRETS = ['change-this-secret-for-production', 'dev-secret-key']
const MIN_PRODUCTION_SECRET_LENGTH = 16

export function isProduction(env = process.env) {
  return env.NODE_ENV === 'production'
}

/**
 * Resolve the JWT signing secret.
 * - production: throws unless a non-default secret (>= 16 chars) is configured.
 * - otherwise: warns when using a default secret; if none is set, generates an
 *   ephemeral random one (tokens stop working on restart, same as the in-memory store).
 */
export function resolveJwtSecret(env = process.env, warn = console.warn) {
  const secret = env.JWT_SECRET
  const isDefault = !secret || KNOWN_DEFAULT_SECRETS.includes(secret)

  if (isProduction(env)) {
    if (isDefault || secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be set to a unique value of at least ${MIN_PRODUCTION_SECRET_LENGTH} characters when NODE_ENV=production ` +
        '(e.g. `node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"`).'
      )
    }
    return secret
  }

  if (!secret) {
    warn('[config] JWT_SECRET is not set; using a random per-process secret (tokens are invalidated on restart).')
    return crypto.randomBytes(32).toString('hex')
  }
  if (isDefault) {
    warn('[config] JWT_SECRET is a known default value. This is fine for local development but will be rejected in production.')
  }
  return secret
}

let cachedSecret
export function getJwtSecret() {
  if (!cachedSecret) cachedSecret = resolveJwtSecret()
  return cachedSecret
}

/** Allowed browser origins for CORS. Returns `false` (same-origin only) when none apply. */
export function getAllowedOrigins(env = process.env) {
  const configured = (env.CLIENT_URL || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  if (configured.length) return configured
  // In production the SPA is served by this server (same origin), so no CORS needed.
  return isProduction(env) ? false : ['http://localhost:3000']
}
