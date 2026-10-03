import { supabase } from '../supabaseClient.js'
import { logger } from '../lib/logger.js'

const DEFAULT_INACTIVE_DAYS = Number(process.env.INACTIVE_USER_DAYS || 180)

export async function pauseInactiveUsers(days = DEFAULT_INACTIVE_DAYS) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString()

  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .lt('last_active_at', cutoff)
    .is('deleted_at', null)
    .eq('matchmaking_enabled', true)
    .limit(500)

  if (error) throw error

  const ids = (data || []).map((row) => row.id)
  if (!ids.length) return { paused: 0, cutoff }

  const { error: updateError } = await supabase
    .from('users')
    .update({ matchmaking_enabled: false })
    .in('id', ids)

  if (updateError) throw updateError

  logger.info('Inactivity cleanup paused matchmaking', { count: ids.length, cutoff })
  return { paused: ids.length, cutoff }
}
