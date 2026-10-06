import { supabase } from './supabaseClient.js'
import {
  buildTasteLines,
  computeCompatibilityFromMaps,
  findUserById,
  getMutualMatchRow,
  getRatingsForUsers,
  mapPublicUser,
  orderedMatchUsers
} from './db.js'
import { assertDatingLaunched } from './platformService.js'
import { getBlockedUserIds } from './safetyService.js'
import { assertMatchmakingReady } from './services/profileService.js'
import { passesDiscoveryFilters } from './services/discoveryPrefs.js'
import { notifyUser } from './services/notificationService.js'
import { logger } from './lib/logger.js'
import { rankByTaste } from './lib/tasteMatch.js'
import { selectAll, selectAllIn } from './lib/paging.js'
import { genderQueryValues, isMutualInterest } from './lib/datingEligibility.js'
import { sameCountry } from './lib/regionLaunch.js'
import { isPlusActive } from './lib/plus.js'
import { publicPrompts } from './lib/profilePrompts.js'
import { withPersonalities } from './services/personalityService.js'

const CARD_COLUMNS = 'id, display_name, bio, hobbies, city, age, country, gender, photo_url, verification_status, prompts'

function datingOff() {
  const error = new Error('Dating is switched off. Turn it on in Settings to meet people.')
  error.code = 'DATING_OFF'
  return error
}

// Before the global launch, a country that opened on its own only dates within itself.
function inDatingArea(status, self, other) {
  return !status.regionOnly || sameCountry(self.country, other.country)
}

async function getSwipeMap(userId) {
  const rows = await selectAll(() =>
    supabase.from('user_swipes').select('target_id, action').eq('swiper_id', userId).order('id')
  )
  return new Map(rows.map((row) => [row.target_id, row.action]))
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

  // Both people liking at the same moment race to insert the same pair; the loser reads the winner's row.
  if (error?.code === '23505') return getMutualMatchRow(userId, peerId)
  if (error) throw error
  return data
}

export async function recordSwipe(userId, targetId, action) {
  if (userId === targetId) throw new Error('Invalid swipe target')
  if (!['like', 'pass'].includes(action)) throw new Error('Invalid swipe action')

  const self = await findUserById(userId)
  const target = await findUserById(targetId)
  if (!self || !target || target.deleted_at) throw new Error('User not found')

  if (!self.dating_enabled) throw datingOff()
  const status = await assertDatingLaunched(self)
  await assertMatchmakingReady(userId)

  const blocked = await getBlockedUserIds(userId)
  if (blocked.has(targetId)) throw new Error('User unavailable')

  if (!target.dating_enabled) throw new Error('This person is not dating right now.')
  if (!isMutualInterest(self, target)) throw new Error('This profile is not in your dating preferences.')
  if (!inDatingArea(status, self, target)) throw new Error('Dating is open in your country only for now.')

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

// What a profile card shows: the person, then what you two agree on. Their full lists stay private.
function tasteCardFields(candidate, stats) {
  const lines = buildTasteLines(stats, candidate.display_name)
  return {
    ...mapPublicUser(candidate),
    score: stats.score,
    sharedCount: stats.sharedCount,
    sharedLoved: stats.sharedLovedTitles.slice(0, 12),
    sharedHated: stats.sharedHatedTitles.slice(0, 12),
    conflicts: stats.conflicts,
    // Their all-time favourite and how it relates to you ('same' | 'you_liked' | 'you_disliked' | 'not_rated').
    favorite: stats.favorite,
    prompts: publicPrompts(candidate.prompts),
    tasteSummary: stats.summary,
    likedLine: lines.likedLine,
    dislikedLine: lines.dislikedLine
  }
}

// Candidates scored per request. The rest of the pool is still counted, and swiping moves new people in.
const DECK_SCORING_POOL = 300

export async function getDatingDeckWithMeta(userId, limit = 1) {
  const self = await findUserById(userId)
  if (!self) throw new Error('User not found')
  if (!self.dating_enabled) throw datingOff()
  const status = await assertDatingLaunched(self)
  await assertMatchmakingReady(userId)

  const [blocked, swipes] = await Promise.all([getBlockedUserIds(userId), getSwipeMap(userId)])
  const prefs = self.discovery_prefs || {}
  const plus = isPlusActive(self)
  // Plus: hide people below a chosen taste match (score is only known after scoring, so it filters the shortlist).
  const minScore = plus ? Number(prefs.minScore) || 0 : 0

  // Light columns for the whole pool; full profiles only for the people we actually score.
  const candidates = await selectAll(() => {
    let query = supabase
      .from('users')
      .select('id, age, country, gender, interested_in, last_active_at')
      .neq('id', userId)
      .is('deleted_at', null)
      // Only complete, active profiles (photo, bio, country) that the inactivity job has not paused.
      .eq('matchmaking_enabled', true)
      .eq('dating_enabled', true)
      .eq('is_active', true)
      .in('gender', genderQueryValues(self))
      .order('id')
    return query
  })

  const eligible = candidates.filter(
    (candidate) =>
      !blocked.has(candidate.id) &&
      !swipes.has(candidate.id) &&
      isMutualInterest(self, candidate) &&
      inDatingArea(status, self, candidate) &&
      passesDiscoveryFilters(candidate, prefs)
  )

  const activeAt = new Map(eligible.map((candidate) => [candidate.id, String(candidate.last_active_at || '')]))
  const shortlistIds = [...eligible]
    .sort((a, b) => String(b.last_active_at || '').localeCompare(String(a.last_active_at || '')))
    .slice(0, DECK_SCORING_POOL)
    .map((candidate) => candidate.id)

  const profiles = await selectAllIn(shortlistIds, (ids) =>
    supabase.from('users').select(CARD_COLUMNS).in('id', ids).order('id')
  )

  const ratings = await getRatingsForUsers([userId, ...shortlistIds])
  const selfMap = ratings.get(userId)

  const ranked = profiles
    .map((candidate) => {
      const stats = computeCompatibilityFromMaps(selfMap, ratings.get(candidate.id))
      return { ...tasteCardFields(candidate, stats), _lastActive: activeAt.get(candidate.id) || '' }
    })
    .filter((card) => card.score >= minScore)
    // Taste first (match %, then films in common); recent activity only breaks exact ties.
    .sort((a, b) => rankByTaste(a, b) || b._lastActive.localeCompare(a._lastActive))
    .slice(0, limit)
    .map(({ _lastActive, ...card }) => card)
  const deck = await withPersonalities(ranked)

  const { data: statsRow } = await supabase
    .from('user_deck_stats')
    .select('swipes_total, likes_total, passes_total')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    deck,
    meta: {
      swipedCount: swipes.size,
      remainingInPool: eligible.length,
      discoveryPrefs: prefs,
      regionOnly: status.regionOnly,
      plus,
      stats: statsRow || { swipes_total: swipes.size, likes_total: 0, passes_total: 0 }
    }
  }
}

export async function getMutualMatches(userId) {
  await assertDatingLaunched(await findUserById(userId))

  const blocked = await getBlockedUserIds(userId)

  const rows = await selectAll(() =>
    supabase
      .from('matches')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('updated_at', { ascending: false })
      .order('id')
  )

  const peerIds = rows
    .map((row) => (row.user_a === userId ? row.user_b : row.user_a))
    .filter((peerId) => !blocked.has(peerId))

  if (!peerIds.length) return []

  const users = await selectAllIn(peerIds, (ids) =>
    supabase
      .from('users')
      .select(CARD_COLUMNS)
      .in('id', ids)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('id')
  )

  const ratings = await getRatingsForUsers([userId, ...peerIds])
  const selfMap = ratings.get(userId)
  const byId = new Map((users || []).map((row) => [row.id, row]))

  const matches = rows
    .map((row) => {
      const peerId = row.user_a === userId ? row.user_b : row.user_a
      const candidate = byId.get(peerId)
      if (!candidate) return null

      const stats = computeCompatibilityFromMaps(selfMap, ratings.get(peerId))
      return {
        ...tasteCardFields(candidate, stats),
        matchId: row.id,
        chatUnlocked: row.chat_unlocked,
        introPending: !row.chat_unlocked
      }
    })
    .filter(Boolean)
  return withPersonalities(matches)
}

// People who liked you and are waiting for your answer. Everyone sees the count; Plus sees who they are.
export async function getLikesYou(userId) {
  const self = await findUserById(userId)
  if (!self) throw new Error('User not found')
  const status = await assertDatingLaunched(self)
  if (!self.dating_enabled) return { count: 0, plus: isPlusActive(self), profiles: [] }

  const [blocked, swipes] = await Promise.all([getBlockedUserIds(userId), getSwipeMap(userId)])
  const incoming = await selectAll(() =>
    supabase.from('user_swipes').select('swiper_id, created_at').eq('target_id', userId).eq('action', 'like').order('id')
  )
  const pendingIds = incoming.map((row) => row.swiper_id).filter((id) => !blocked.has(id) && !swipes.has(id))
  if (!pendingIds.length) return { count: 0, plus: isPlusActive(self), profiles: [] }

  const people = await selectAllIn(pendingIds, (ids) =>
    supabase
      .from('users')
      .select(`${CARD_COLUMNS}, interested_in`)
      .in('id', ids)
      .is('deleted_at', null)
      .eq('is_active', true)
      .eq('dating_enabled', true)
      .order('id')
  )
  const visible = people.filter((p) => isMutualInterest(self, p) && inDatingArea(status, self, p))
  const plus = isPlusActive(self)
  if (!plus) return { count: visible.length, plus, profiles: [] }

  const ratings = await getRatingsForUsers([userId, ...visible.map((p) => p.id)])
  const selfMap = ratings.get(userId)
  const profiles = await withPersonalities(
    visible.map((p) => tasteCardFields(p, computeCompatibilityFromMaps(selfMap, ratings.get(p.id)))).sort(rankByTaste)
  )
  return { count: profiles.length, plus, profiles }
}

export async function undoLastSwipe(userId) {
  await assertDatingLaunched(await findUserById(userId))
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
