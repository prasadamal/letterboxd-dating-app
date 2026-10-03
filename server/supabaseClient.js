import { createClient } from '@supabase/supabase-js'
import { env } from './config/env.js'

const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!key) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.')
}

if (env.NODE_ENV === 'production' && !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production.')
}

export const supabase = createClient(env.SUPABASE_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false }
})
