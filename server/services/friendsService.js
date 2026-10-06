import { supabase } from '../supabaseClient.js'
import { findUserById, getMutualMatchRow, getRatingsForUsers, mapPublicUser } from '../db.js'
import { getBlockedUserIds } from '../safetyService.js'
import { AppError } from '../middleware/errors.js'
import { selectAll, selectAllIn } from '../lib/paging.js'
import { compareTaste, rarityWeight, rankByTaste } from '../lib/tasteMatch.js'
import { personalityBadge } from '../lib/filmPersonality.js'
import { getPersonalities, withPersonalities } from './personalityService.js'

// Film friends: compare taste with anyone, not just dating matches. Works before dating opens.
// Your friend code is your referral code; adding someone by code makes you friends both ways.

export async function addFriendByCode(userId, code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!normalized) throw new AppError('Enter a friend code', 400, 'VALIDATION_ERROR')

  const { data: friend, error } = await supabase
    .from('users')
    .select('id, deleted_at, is_active')
    .eq('referral_code', normalized)
    .maybeSingle()
  if (error) throw error
  if (!friend || friend.deleted_at || friend.is_active === false) throw new AppError('No one has that code', 404, 'NOT_FOUND')
  if (friend.id === userId) throw new AppError("That's your own code", 400, 'INVALID_TARGET')

  const blocked = await getBlockedUserIds(userId)
  if (blocked.has(friend.id)) throw new AppError('No one has that code', 404, 'NOT_FOUND')

  const now = new Date().toISOString()
  const { error: insertError } = await supabase.from('film_friends').upsert(
    [
      { user_id: userId, friend_id: friend.id, created_at: now },
      { user_id: friend.id, friend_id: userId, created_at: now }
    ],
    { onConflict: 'user_id,friend_id', ignoreDuplicates: true }
  )
  if (insertError) throw insertError
  return { friendId: friend.id }
}

export async function removeFriend(userId, friendId) {
  for (const [a, b] of [[userId, friendId], [friendId, userId]]) {
    const { error } = await supabase.from('film_friends').delete().eq('user_id', a).eq('friend_id', b)
    if (error) throw error
  }
  return { ok: true }
}

async function friendIds(userId) {
  const rows = await selectAll(() => supabase.from('film_friends').select('friend_id').eq('user_id', userId).order('friend_id'))
  return rows.map((row) => row.friend_id)
}

const PERSON_COLUMNS = 'id, display_name, bio, hobbies, city, age, country, gender, photo_url, verification_status, deleted_at, is_active'

export async function listFriends(userId) {
  const blocked = await getBlockedUserIds(userId)
  const ids = (await friendIds(userId)).filter((id) => !blocked.has(id))
  if (!ids.length) return []

  const people = await selectAllIn(ids, (part) => supabase.from('users').select(PERSON_COLUMNS).in('id', part).order('id'))
  const ratings = await getRatingsForUsers([userId, ...ids])
  const mine = ratings.get(userId)
  const friends = people
    .filter((p) => !p.deleted_at && p.is_active !== false)
    .map((p) => {
      const stats = compareTaste(mine, ratings.get(p.id))
      return {
        ...mapPublicUser(p),
        score: stats.score,
        sharedCount: stats.sharedCount,
        favorite: stats.favorite
      }
    })
    .sort(rankByTaste)
  return withPersonalities(friends)
}

async function canCompare(userId, otherId) {
  if (userId === otherId) return false
  const other = await findUserById(otherId)
  if (!other || other.deleted_at || other.is_active === false) return false
  const blocked = await getBlockedUserIds(userId)
  if (blocked.has(otherId)) return false

  const { data, error } = await supabase
    .from('film_friends')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('friend_id', otherId)
    .maybeSingle()
  if (error) throw error
  if (data) return other
  return (await getMutualMatchRow(userId, otherId)) ? other : false
}

// Films one person liked that the other hasn't liked or disliked yet (unseen or unrated), rarest first.
export function watchTogetherPicks(from, to, limit = 8) {
  if (!from) return []
  const rated = new Set([...(to?.love || []), ...(to?.hate || [])])
  return [...from.love]
    .filter((id) => !rated.has(id))
    .sort((x, y) => rarityWeight(from.popularity?.get(y)) - rarityWeight(from.popularity?.get(x)))
    .slice(0, limit)
    .map((id) => from.titles?.get(id) || String(id))
}

export async function compareWith(userId, otherId) {
  const other = await canCompare(userId, otherId)
  if (!other) throw new AppError('You can compare taste with your film friends and matches', 404, 'NOT_FOUND')

  const [ratings, personalities] = await Promise.all([getRatingsForUsers([userId, otherId]), getPersonalities([userId, otherId])])
  const mine = ratings.get(userId)
  const theirs = ratings.get(otherId)
  const stats = compareTaste(mine, theirs)
  const myFavorite = mine?.favorite != null ? mine.titles?.get(mine.favorite) || null : null

  return {
    person: { ...mapPublicUser(other), personality: personalityBadge(personalities.get(otherId)) },
    myPersonality: personalityBadge(personalities.get(userId)),
    score: stats.score,
    sharedCount: stats.sharedCount,
    conflicts: stats.conflicts,
    sharedLoved: stats.sharedLovedTitles,
    sharedHated: stats.sharedHatedTitles,
    theirFavorite: stats.favorite,
    myFavorite,
    watchTogether: {
      // "They loved these and you haven't rated them" — and the other way round.
      forYou: watchTogetherPicks(theirs, mine),
      forThem: watchTogetherPicks(mine, theirs)
    }
  }
}
