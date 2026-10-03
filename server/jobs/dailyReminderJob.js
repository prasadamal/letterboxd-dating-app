import { supabase } from '../supabaseClient.js'
import { notifyUser } from '../services/notificationService.js'
import { logger } from '../lib/logger.js'

export async function sendDailyGameReminders() {
  const day = new Date().toISOString().slice(0, 10)

  const { data: tokenRows, error } = await supabase.from('push_tokens').select('user_id')
  if (error) throw error

  const userIds = [...new Set((tokenRows || []).map((row) => row.user_id))]
  let sent = 0
  let skipped = 0

  for (const userId of userIds) {
    const { count, error: ratingError } = await supabase
      .from('user_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${day}T00:00:00.000Z`)

    if (ratingError) {
      logger.warn('daily reminder rating check failed', { userId, message: ratingError.message })
      continue
    }

    if (count && count > 0) {
      skipped += 1
      continue
    }

    await notifyUser(userId, 'daily_game')
    sent += 1
  }

  return { day, sent, skipped, candidates: userIds.length }
}
