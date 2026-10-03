import { supabase } from './supabaseClient.js'
import {
  buildTasteLines,
  computeCompatibilityFromMaps,
  findUserById,
  getMutualMatchRow,
  getRatingsForUsers,
  mapUserRow,
  orderedMatchUsers
} from './db.js'
import { assertDatingLaunched } from './platformService.js'
import { getBlockedUserIds } from './safetyService.js'
import { assertMatchmakingReady } from './services/profileService.js'
import { passesDiscoveryFilters } from './services/discoveryPrefs.js'
import { notifyUser } from './services/notificationService.js'
import { logger } from './lib/logger.js'

function oppositeGender(gender) {
  if (gender === 'male') return 'female'
  if (gender === 'female') return 'male'
  return null
}

async function getSwipeMap(userId) {
  const { data, error } = await supabase.from('user_swipes').select('target_id, action').eq('swiper_id', userId)
  if (error) throw error
  return new Map((data || []).map((row) => [row.target_id, row.action]))
}

async function createMutualMatch(userId, peerId) {
  const existing = await getMutualMatchRow(userId, peerId)
  if (existing) return existing

  const ratings = await getRatingsForUsers([userId, peerId])
  const stats = computeCompatibilityFromMaps(ratings.get(userId), ratings.get(peerId))

  const [userA, userB] = await orderedMatchUsers(userId, peerId)
  const { data, error } = await supabase
    .from('matches')
    .insert({
      user_a: userA,
      user_b: userB,
      compatibility: stats.score,
      shared_loves: stats.sharedLove || 0,
      shared_hates: stats.sharedHate || 0,
      conflicts: stats.conflicts || 0,
      chat_unlocked: false,
      user_a_intro_sent: false,
      user_b_intro_sent: false
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function recordSwipe(userId, targetId, action) {
  await assertDatingLaunched()
  await assertMatchmakingReady(userId)

  if (userId === targetId) throw new Error('Invalid swipe target')
  if (!['like', 'pass'].includes(action)) throw new Error('Invalid swipe action')

  const self = await findUserById(userId)
  const target = await findUserById(targetId)
  if (!self || !target || target.deleted_at) throw new Error('User not found')

  const blocked = await getBlockedUserIds(userId)
  if (blocked.has(targetId)) throw new Error('User unavailable')

  const expected = oppositeGender(self.gender)
  if (expected && target.gender !== expected) {
    throw new Error('Profiles are matched across complementary registration groups.')
  }

  const { error } = await supabase.from('user_swipes').upsert(
    {
      swiper_id: userId,
      target_id: targetId,
      action,
      created_at: new Date().toISOString()
    },
    { onConflict: 'swiper_id,target_id' }
  )

  if (error) throw error

  await bumpSwipeStats(userId, action)

  let matched = false
  let matchRow = null

  if (action === 'like') {
    const { data: reverse, error: reverseError } = await supabase
      .from('user_swipes')
      .select('action')
      .eq('swiper_id', targetId)
      .eq('target_id', userId)
      .maybeSingle()

    if (reverseError) throw reverseError
    if (reverse?.action === 'like') {
      matchRow = await createMutualMatch(userId, targetId)
      matched = true
      await Promise.all([
        notifyUser(userId, 'new_match', { peerId: targetId }),
        notifyUser(targetId, 'new_match', { peerId: userId })
      ])
    }
  }

  return { ok: true, matched, matchId: matchRow?.id || null }
}

async function bumpSwipeStats(userId, action) {
  const { data, error: readError } = await supabase
    .from('user_deck_stats')
    .select('swipes_total, likes_total, passes_total')
    .eq('user_id', userId)
    .maybeSingle()

  if (readError && readError.code !== 'PGRST116') {
    logger.warn('deck stats read skipped', { message: readError.message })
    return
  }

  const base = data || { swipes_total: 0, likes_total: 0, passes_total: 0 }
  const { error } = await supabase.from('user_deck_stats').upsert({
    user_id: userId,
    swipes_total: base.swipes_total + 1,
    likes_total: base.likes_total + (action === 'like' ? 1 : 0),
    passes_total: base.passes_total + (action === 'pass' ? 1 : 0),
    updated_at: new Date().toISOString()
  })

  if (error) logger.warn('deck stats write skipped', { message: error.message })
}

export async function getDatingDeck(userId, limit = 1) {
  await assertDatingLaunched()
  await assertMatchmakingReady(userId)

  const self = await findUserById(userId)
  if (!self) throw new Error('User not found')

  const blocked = await getBlockedUserIds(userId)
  const swipes = await getSwipeMap(userId)
  const targetGender = oppositeGender(self.gender)

  const prefs = self.discovery_prefs || {}

  let query = supabase
    .from('users')
    .select('id, email, display_name, bio, hobbies, city, age, country, gender, photo_url')
    .neq('id', userId)
    .is('deleted_at', null)

  if (targetGender) query = query.eq('gender', targetGender)

  const { data: candidates, error } = await query
  if (error) throw error

  const filtered = (candidates || []).filter(
    (candidate) =>
      !blocked.has(candidate.id) &&
      !swipes.has(candidate.id) &&
      passesDiscoveryFilters(candidate, prefs)
  )

  const ids = [userId, ...filtered.map((row) => row.id)]
  const ratings = await getRatingsForUsers(ids)
  const selfMap = ratings.get(userId)

  const deck = filtered
    .map((candidate) => {
      const stats = computeCompatibilityFromMaps(selfMap, ratings.get(candidate.id))
      const taste = ratings.get(candidate.id)?.labels || { love: [], hate: [] }
      const lines = buildTasteLines(selfMap?.labels, taste, candidate.display_name)
      return {
        ...mapUserRow(candidate, { loved: taste.love, hated: taste.hate }),
        score: stats.score,
        tasteSummary: stats.summary,
        likedLine: lines.likedLine,
        dislikedLine: lines.dislikedLine
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return deck
}

export async function getDatingDeckMeta(userId) {
  await assertDatingLaunched()
  await assertMatchmakingReady(userId)

  const self = await findUserById(userId)
  if (!self) throw new Error('User not found')

  const blocked = await getBlockedUserIds(userId)
  const swipes = await getSwipeMap(userId)
  const targetGender = oppositeGender(self.gender)
  const prefs = self.discovery_prefs || {}

  let query = supabase.from('users').select('id, age, country, gender').neq('id', userId).is('deleted_at', null)
  if (targetGender) query = query.eq('gender', targetGender)

  const { data: candidates, error } = await query
  if (error) throw error

  const eligible = (candidates || []).filter(
    (candidate) =>
      !blocked.has(candidate.id) &&
      !swipes.has(candidate.id) &&
      passesDiscoveryFilters(candidate, prefs)
  )

  const { data: statsRow } = await supabase
    .from('user_deck_stats')
    .select('swipes_total, likes_total, passes_total')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    swipedCount: swipes.size,
    remainingInPool: eligible.length,
    discoveryPrefs: prefs,
    stats: statsRow || { swipes_total: swipes.size, likes_total: 0, passes_total: 0 }
  }
}

export async function getMutualMatches(userId) {
  await assertDatingLaunched()

  const blocked = await getBlockedUserIds(userId)

  const { data: rows, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const peerIds = (rows || [])
    .map((row) => (row.user_a === userId ? row.user_b : row.user_a))
    .filter((peerId) => !blocked.has(peerId))

  if (!peerIds.length) return []

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, display_name, bio, hobbies, city, age, country, gender, photo_url')
    .in('id', peerIds)
    .is('deleted_at', null)

  if (usersError) throw usersError

  const ratings = await getRatingsForUsers([userId, ...peerIds])
  const selfMap = ratings.get(userId)
  const byId = new Map((users || []).map((row) => [row.id, row]))

  return (rows || [])
    .map((row) => {
      const peerId = row.user_a === userId ? row.user_b : row.user_a
      const candidate = byId.get(peerId)
      if (!candidate) return null

      const taste = ratings.get(peerId)?.labels || { love: [], hate: [] }
      const lines = buildTasteLines(selfMap?.labels, taste, candidate.display_name)
      return {
        ...mapUserRow(candidate, { loved: taste.love, hated: taste.hate }),
        score: row.compatibility,
        matchId: row.id,
        chatUnlocked: row.chat_unlocked,
        introPending: !row.chat_unlocked,
        tasteSummary: buildTasteLines(selfMap?.labels, taste, candidate.display_name).likedLine,
        likedLine: lines.likedLine,
        dislikedLine: lines.dislikedLine
      }
    })
    .filter(Boolean)
}

export async function undoLastSwipe(userId) {
  await assertDatingLaunched()
  await assertMatchmakingReady(userId)

  const { data: swipe, error } = await supabase
    .from('user_swipes')
    .select('target_id, action, created_at')
    .eq('swiper_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!swipe) {
    const missing = new Error('Nothing to undo')
    missing.code = 'NO_SWIPE'
    throw missing
  }

  if (swipe.action === 'like') {
    const match = await getMutualMatchRow(userId, swipe.target_id)
    if (match) {
      const locked = new Error('A match cannot be undone')
      locked.code = 'MATCH_LOCKED'
      throw locked
    }
  }

  const { error: deleteError } = await supabase
    .from('user_swipes')
    .delete()
    .eq('swiper_id', userId)
    .eq('target_id', swipe.target_id)

  if (deleteError) throw deleteError
  return { ok: true, targetId: swipe.target_id, action: swipe.action }
}

export async function getReferralInfo(userId) {
  const user = await findUserById(userId)
  if (!user) throw new Error('User not found')

  let code = user.referral_code
  if (!code) {
    code = `REEL${String(userId).slice(0, 6).toUpperCase()}`
    await supabase.from('users').update({ referral_code: code }).eq('id', userId)
  }

  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', userId)

  if (error) throw error

  return {
    code,
    referrals: count || 0,
    shareMessage: `Join ReelMates with my code ${code} — match through movie taste.`
  }
}

export async function applyReferralCode(userId, code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) throw new Error('Referral code required')

  const { data: referrer, error } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', normalized)
    .maybeSingle()

  if (error) throw error
  if (!referrer) throw new Error('Invalid referral code')
  if (referrer.id === userId) throw new Error('You cannot use your own code')

  await supabase.from('users').update({ referred_by: referrer.id }).eq('id', userId)
  return { ok: true }
}
