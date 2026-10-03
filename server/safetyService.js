import { supabase } from './supabaseClient.js'
import { findUserById } from './db.js'

export async function getBlockedUserIds(userId) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

  if (error) throw error

  const blocked = new Set()
  for (const row of data || []) {
    if (row.blocker_id === userId) blocked.add(row.blocked_id)
    if (row.blocked_id === userId) blocked.add(row.blocker_id)
  }
  return blocked
}

export async function blockUser(blockerId, blockedId, reason = '') {
  if (blockerId === blockedId) throw new Error('Cannot block yourself')
  const peer = await findUserById(blockedId)
  if (!peer) throw new Error('User not found')

  const { error } = await supabase.from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
    created_at: new Date().toISOString()
  })

  if (error && error.code !== '23505') throw error
  return { ok: true, reason: reason || null }
}

export async function reportUser(reporterId, reportedId, reason, details = '') {
  if (reporterId === reportedId) throw new Error('Cannot report yourself')
  const peer = await findUserById(reportedId)
  if (!peer) throw new Error('User not found')

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      reason: String(reason || 'other').slice(0, 120),
      details: String(details || '').slice(0, 2000),
      status: 'open'
    })
    .select('id, status, created_at')
    .single()

  if (error) throw error

  await supabase.from('moderation_queue').insert({
    report_id: data.id,
    status: 'open'
  })

  return data
}

export async function deleteUserAccount(userId) {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: now,
      email: `deleted+${userId}@reelmates.invalid`,
      display_name: 'Deleted user',
      bio: '',
      photo_url: null,
      password_hash: 'deleted'
    })
    .eq('id', userId)

  if (error) throw error
  return { ok: true, deletedAt: now }
}
