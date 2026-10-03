import { supabase } from '../supabaseClient.js'
import { revokeAllRefreshTokens } from './authService.js'

export async function listModerationQueue(status = 'open') {
  let query = supabase
    .from('moderation_queue')
    .select('id, report_id, status, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)

  const { data: queue, error } = await query
  if (error) throw error
  if (!queue?.length) return []

  const reportIds = queue.map((row) => row.report_id).filter(Boolean)
  if (!reportIds.length) return queue.map((row) => ({ ...row, report: null }))

  const { data: reports, error: reportError } = await supabase
    .from('reports')
    .select('id, reporter_id, reported_id, reason, details, status, created_at')
    .in('id', reportIds)

  if (reportError) throw reportError
  const byId = new Map((reports || []).map((r) => [r.id, r]))

  return queue.map((row) => ({ ...row, report: byId.get(row.report_id) || null }))
}

export async function updateModerationItem(queueId, status) {
  const allowed = ['open', 'reviewing', 'resolved', 'dismissed']
  if (!allowed.includes(status)) throw new Error('Invalid status')

  const { data, error } = await supabase
    .from('moderation_queue')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', queueId)
    .select('*')
    .single()

  if (error) throw error
  if (data?.report_id) {
    // reports.status only allows open / reviewed / dismissed.
    const reportStatus = status === 'dismissed' ? 'dismissed' : status === 'resolved' ? 'reviewed' : 'open'
    const { error: reportError } = await supabase.from('reports').update({ status: reportStatus }).eq('id', data.report_id)
    if (reportError) throw reportError
  }
  return data
}

// Suspension hides the person from discovery and chat and ends their sessions; lifting it restores access.
export async function setUserSuspended(userId, suspended) {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: !suspended, ...(suspended ? { matchmaking_enabled: false } : {}) })
    .eq('id', userId)
    .is('deleted_at', null)
    .select('id, is_active')
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  if (suspended) await revokeAllRefreshTokens(userId)
  return data
}
