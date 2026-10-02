import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  CLIENT_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_ANON_KEY: z.string().min(20).optional(),
  LAUNCH_MALE_TARGET: z.coerce.number().int().positive().default(500),
  LAUNCH_FEMALE_TARGET: z.coerce.number().int().positive().default(500),
  DAILY_MOVIE_COUNT: z.coerce.number().int().min(5).max(20).default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(40),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  APP_PUBLIC_URL: z.string().url().optional()
})

export function loadEnv() {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors
    console.error('Invalid environment configuration:', JSON.stringify(details, null, 2))
    process.exit(1)
  }

  const env = parsed.data

  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.includes('change-this') || env.JWT_SECRET.length < 32) {
      console.error('Production requires a strong JWT_SECRET (32+ chars, not placeholder).')
      process.exit(1)
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Production requires SUPABASE_SERVICE_ROLE_KEY.')
      process.exit(1)
    }
    if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET.length < 32) {
      console.error('Production requires JWT_REFRESH_SECRET (32+ chars).')
      process.exit(1)
    }
  } else if (!env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_ANON_KEY) {
    console.error('Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY for local development.')
    process.exit(1)
  }

  return env
}

export const env = loadEnv()
