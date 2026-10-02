import { supabase } from '../supabaseClient.js'
import { findUserById, updateUserProfile } from '../db.js'
import { computeProfileCompletion } from './auditService.js'

export const MATCHMAKING_MIN_COMPLETION = Number(process.env.MATCHMAKING_MIN_COMPLETION || 80)

export async function syncProfileCompletion(userId) {
  const user = await findUserById(userId)
  if (!user) return null

  const completion = computeProfileCompletion(user)
  const matchmakingEnabled = completion >= MATCHMAKING_MIN_COMPLETION

  await updateUserProfile(userId, {
    profile_completion: completion,
    matchmaking_enabled: matchmakingEnabled
  })

  return { completion, matchmakingEnabled, missing: missingFields(user, completion) }
}

export function missingFields(user, completion) {
  const missing = []
  if (!user?.photo_url) missing.push('photo')
  if (!user?.bio) missing.push('bio')
  if (!user?.country) missing.push('country')
  if (!user?.email_verified_at) missing.push('email_verification')
  if (completion < MATCHMAKING_MIN_COMPLETION) missing.push('profile_completion')
  return missing
}

export async function assertMatchmakingReady(userId) {
  const state = await syncProfileCompletion(userId)
  if (!state?.matchmakingEnabled) {
    const error = new Error('Complete your profile before matchmaking.')
    error.status = 403
    error.code = 'PROFILE_INCOMPLETE'
    error.details = { completion: state?.completion ?? 0, missing: state?.missing ?? [] }
    throw error
  }
  return state
}

export async function saveProfilePhotoRecord(userId, url, isPrimary = true) {
  if (isPrimary) {
    await supabase.from('profile_photos').update({ is_primary: false }).eq('user_id', userId)
  }
  await supabase.from('profile_photos').insert({ user_id: userId, url, is_primary: isPrimary })
  await updateUserProfile(userId, { photo_url: url })
  return syncProfileCompletion(userId)
}
