import { supabase } from '../supabaseClient.js'
import { logger } from '../lib/logger.js'

export async function registerPushToken(userId, token, platform) {
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      created_at: new Date().toISOString()
    },
    { onConflict: 'user_id,token' }
  )
  if (error) throw error
  return { ok: true }
}

export async function notifyUser(userId, event, payload = {}) {
  // Hook for Expo push / FCM — implement sender in Phase 3
  logger.info('Notification queued', { userId, event, payload })
  return { queued: true, delivered: false }
}
