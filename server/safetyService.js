import { supabase } from './supabaseClient.js'
import { findUserById } from './db.js'
import { AppError } from './middleware/errors.js'
import { removeUserAvatars } from './services/storageService.js'
import { chunk, selectAll } from './lib/paging.js'

export async function getBlockedUserIds(userId) {
  const data = await selectAll(() =>
    supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
      .order('blocker_id')
      .order('blocked_id')
  )

  const blocked = new Set()
  for (const row of data) {
    if (row.blocker_id === userId) blocked.add(row.blocked_id)
    if (row.blocked_id === userId) blocked.add(row.blocker_id)
  }
  return blocked
}

export async function blockUser(blockerId, blockedId, reason = '') {
  if (blockerId === blockedId) throw new AppError('You cannot block yourself', 400, 'INVALID_TARGET')
  const peer = await findUserById(blockedId)
  if (!peer) throw new AppError('User not found', 404, 'NOT_FOUND')

  const { error } = await supabase.from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
    created_at: new Date().toISOString()
  })

  if (error && error.code !== '23505') throw error
  return { ok: true, reason: reason || null }
}

export async function reportUser(reporterId, reportedId, reason, details = '') {
  if (reporterId === reportedId) throw new AppError('You cannot report yourself', 400, 'INVALID_TARGET')
  const peer = await findUserById(reportedId)
  if (!peer) throw new AppError('User not found', 404, 'NOT_FOUND')

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

async function deleteWhere(table, column, values) {
  const { error } = await supabase.from(table).delete().in(column, values)
  if (error) throw error
}

// Removes everything tied to the account. Every step is idempotent, so a failed request can simply be retried.
export async function deleteUserAccount(userId) {
  const matches = await selectAll(() =>
    supabase.from('matches').select('id').or(`user_a.eq.${userId},user_b.eq.${userId}`).order('id')
  )

  const matchIds = matches.map((row) => row.id)
  for (const ids of chunk(matchIds)) {
    const conversations = await selectAll(() => supabase.from('conversations').select('id').in('match_id', ids).order('id'))
    const conversationIds = conversations.map((row) => row.id)
    if (conversationIds.length) {
      await deleteWhere('messages', 'conversation_id', conversationIds)
      await deleteWhere('conversations', 'id', conversationIds)
    }
    await deleteWhere('matches', 'id', ids)
  }

  await deleteWhere('messages', 'sender_id', [userId])
  await deleteWhere('user_swipes', 'swiper_id', [userId])
  await deleteWhere('user_swipes', 'target_id', [userId])
  for (const table of ['user_ratings', 'daily_batches', 'user_deck_stats', 'profile_photos', 'push_tokens', 'auth_tokens', 'refresh_tokens']) {
    await deleteWhere(table, 'user_id', [userId])
  }
  await deleteWhere('blocks', 'blocker_id', [userId])
  await deleteWhere('blocks', 'blocked_id', [userId])

  const { error: referralError } = await supabase.from('users').update({ referred_by: null }).eq('referred_by', userId)
  if (referralError) throw referralError

  await removeUserAvatars(userId)

  // Keep an anonymous tombstone so reports filed about this account stay reviewable.
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: now,
      email: `deleted+${userId}@reelmates.invalid`,
      password_hash: 'deleted',
      display_name: 'Deleted user',
      bio: '',
      hobbies: [],
      photo_url: null,
      referral_code: null,
      taste_vector: {},
      discovery_prefs: {},
      birth_date: null,
      age: null,
      city: '',
      country: '',
      gender: null,
      language: null,
      verification_notes: null,
      matchmaking_enabled: false,
      is_active: false
    })
    .eq('id', userId)

  if (error) throw error
  return { ok: true, deletedAt: now }
}
