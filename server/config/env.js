import 'dotenv/config'
import { z } from 'zod'

// `KEY=` in a .env file arrives as an empty string; treat it as "not set" so copying .env.example works.
const optional = (schema) => z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

// Accepts "noreply@example.com" or "ReelMates <noreply@example.com>" (the format Resend expects).
const emailSender = z
  .string()
  .regex(/^(?:[^<>@]+<\s*[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+\s*>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/, 'Use "Name <email>" or an email')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // Number of reverse proxies in front of the API (load balancer, CDN). Needed for per-client rate limits.
  TRUST_PROXY: optional(z.coerce.number().int().min(0).max(5)),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: optional(z.string().min(16)),
  CLIENT_URL: optional(z.string().url()),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: optional(z.string().min(20)),
  SUPABASE_ANON_KEY: optional(z.string().min(20)),
  // Only used to create the platform_settings row on an empty database. Change targets in /admin afterwards.
  LAUNCH_MALE_TARGET: optional(z.coerce.number().int().positive()).default(500),
  LAUNCH_FEMALE_TARGET: optional(z.coerce.number().int().positive()).default(500),
  // Local testing only: report dating as open from this API instance without touching the shared database.
  FORCE_DATING_OPEN: optional(z.enum(['true', 'false'])).transform((value) => value === 'true'),
  DAILY_MOVIE_COUNT: optional(z.coerce.number().int().min(5).max(20)).default(10),
  RATE_LIMIT_WINDOW_MS: optional(z.coerce.number().int().positive()).default(900000),
  RATE_LIMIT_MAX: optional(z.coerce.number().int().positive()).default(300),
  AUTH_RATE_LIMIT_MAX: optional(z.coerce.number().int().positive()).default(40),
  RESEND_API_KEY: optional(z.string()),
  EMAIL_FROM: optional(emailSender),
  APP_PUBLIC_URL: optional(z.string().url()),
  ADMIN_API_KEY: optional(z.string().min(16)),
  CRON_SECRET: optional(z.string().min(16)),
  SENTRY_DSN: optional(z.string().url()),
  POSTHOG_API_KEY: optional(z.string()),
  POSTHOG_HOST: optional(z.string().url()),
  // RevenueCat → Project settings → Integrations → Webhooks → Authorization header value (sent verbatim).
  REVENUECAT_WEBHOOK_AUTH: optional(z.string().min(16)),
  INACTIVE_USER_DAYS: optional(z.coerce.number().int().min(30).max(730)).default(180)
})

function looksLikePlaceholder(secret) {
  return /change-this|change-me|dev-only|placeholder/i.test(secret)
}

export function loadEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors
    console.error('Invalid environment configuration:', JSON.stringify(details, null, 2))
    process.exit(1)
  }

  const env = parsed.data

  // Render injects its public URL; use it for email links when APP_PUBLIC_URL isn't set.
  env.APP_PUBLIC_URL ??= process.env.RENDER_EXTERNAL_URL || undefined

  if (env.NODE_ENV === 'production') {
    if (looksLikePlaceholder(env.JWT_SECRET) || env.JWT_SECRET.length < 32) {
      console.error('Production requires a strong JWT_SECRET (32+ random chars, not the example value).')
      process.exit(1)
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Production requires SUPABASE_SERVICE_ROLE_KEY.')
      process.exit(1)
    }
    if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32 || looksLikePlaceholder(env.JWT_REFRESH_SECRET)) {
      console.error('Production requires JWT_REFRESH_SECRET (32+ random chars, not the example value).')
      process.exit(1)
    }
    if (env.FORCE_DATING_OPEN) {
      console.error('FORCE_DATING_OPEN is for local testing only. Open dating from /admin instead.')
      process.exit(1)
    }
  } else if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'SUPABASE_SERVICE_ROLE_KEY is required. Direct anon access is revoked by RLS; the API must use the service role.'
    )
    process.exit(1)
  }

  return env
}

// Features that silently do nothing without configuration; surfaced in /health and startup logs.
export function missingProductionConfig(env) {
  const missing = []
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) missing.push('email (RESEND_API_KEY, EMAIL_FROM): password reset and verification emails are not sent')
  if (!env.APP_PUBLIC_URL) missing.push('APP_PUBLIC_URL: email links point to localhost')
  if (!env.ADMIN_API_KEY) missing.push('ADMIN_API_KEY: moderation and launch controls are disabled')
  if (!env.CRON_SECRET) missing.push('CRON_SECRET: daily reminders and inactivity cleanup cannot run')
  return missing
}

export const env = loadEnv()
