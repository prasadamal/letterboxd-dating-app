import { supabase } from '../supabaseClient.js'
import { findUserById, getRatingsForUsers, getChatMeta } from '../db.js'
import { AppError } from '../middleware/errors.js'
import { compareTaste, rarityWeight } from '../lib/tasteMatch.js'
import { nextStreak, displayStreak, utcDay } from '../lib/streaks.js'
import { buildIcebreakers } from '../lib/icebreakers.js'
import { publicPrompts } from '../lib/profilePrompts.js'
import { getTasteStats } from './filmService.js'
import { logger } from '../lib/logger.js'

// Called after every rating; writes only on the first rating of a UTC day.
export async function recordDailyActivity(userId, today = utcDay()) {
  const { data: row, error } = await supabase
    .from('users')
    .select('streak_current, streak_best, streak_last_day')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  const next = nextStreak({ current: row?.streak_current, best: row?.streak_best, lastDay: row?.streak_last_day }, today)
  if (!next) return displayStreak({ current: row.streak_current, best: row.streak_best, lastDay: row.streak_last_day }, today)

  const { error: writeError } = await supabase
    .from('users')
    .update({ streak_current: next.current, streak_best: next.best, streak_last_day: next.lastDay })
    .eq('id', userId)
  if (writeError) logger.warn('streak write skipped', { message: writeError.message })
  return { current: next.current, best: next.best, playedToday: true }
}

export async function setTasteCardPublic(userId, isPublic) {
  const { error } = await supabase.from('users').update({ taste_card_public: isPublic }).eq('id', userId)
  if (error) throw error
  return { public: isPublic }
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'A ReelMates member'
}

// Public, shareable taste card (/taste/<friend code>). Only what the member chose to share:
// first name, favourite, rarest liked films, top genres and counts. No photo, age, place or contact.
export async function getPublicTasteCard(code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!/^[A-Z0-9]{4,32}$/.test(normalized)) throw new AppError('Taste card not found', 404, 'NOT_FOUND')

  const { data: user, error } = await supabase
    .from('users')
    .select('id, display_name, referral_code, taste_card_public, deleted_at, is_active, prompts, streak_best')
    .eq('referral_code', normalized)
    .maybeSingle()
  if (error) throw error
  if (!user || !user.taste_card_public || user.deleted_at || user.is_active === false) {
    throw new AppError('Taste card not found', 404, 'NOT_FOUND')
  }

  const [ratings, stats] = await Promise.all([getRatingsForUsers([user.id]), getTasteStats(user.id)])
  const mine = ratings.get(user.id)
  const rarestLiked = [...(mine?.love || [])]
    .sort((a, b) => rarityWeight(mine.popularity?.get(b)) - rarityWeight(mine.popularity?.get(a)))
    .slice(0, 6)
    .map((id) => mine.titles.get(id))

  return {
    name: firstName(user.display_name),
    code: user.referral_code,
    favorite: mine?.favorite != null ? mine.titles.get(mine.favorite) || null : null,
    rarestLiked,
    topGenres: (stats.topGenres || []).slice(0, 3).map((g) => g.name),
    liked: stats.liked,
    disliked: stats.disliked,
    bestStreak: user.streak_best || 0,
    prompts: publicPrompts(user.prompts).slice(0, 1)
  }
}

// Hello ideas for a match, from shared films, favourites, prompts and films neither has rated.
export async function getIcebreakers(userId, peerId) {
  const meta = await getChatMeta(userId, peerId)
  if (!meta) throw new AppError('No conversation', 404, 'NOT_FOUND')

  const peer = await findUserById(peerId)
  const ratings = await getRatingsForUsers([userId, peerId])
  const mine = ratings.get(userId)
  const theirs = ratings.get(peerId)
  const stats = compareTaste(mine, theirs)

  return buildIcebreakers({
    sharedLoved: stats.sharedLovedTitles,
    sharedHated: stats.sharedHatedTitles,
    favorite: stats.favorite,
    myFavorite: mine?.favorite != null ? mine.titles.get(mine.favorite) : null,
    prompts: publicPrompts(peer?.prompts)
  })
}
