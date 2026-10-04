import { supabase } from './supabaseClient.js'
import { env } from './config/env.js'

// Every open app polls the launch status, so serve it from memory for a short while.
const STATUS_TTL_MS = 15_000
let cached = null

export function invalidatePlatformStatus() {
  cached = null
}

// Creates the settings row on an empty database. Never overwrites it: targets are changed from /admin,
// so a local API pointed at the shared database can't move the production launch gate.
export async function ensurePlatformSettings() {
  const { error } = await supabase.from('platform_settings').upsert(
    {
      id: 1,
      male_target: env.LAUNCH_MALE_TARGET,
      female_target: env.LAUNCH_FEMALE_TARGET,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )
  if (error) throw error
}

async function countUsers(gender) {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('gender', gender)
    .is('deleted_at', null)
  if (error) throw error
  return count || 0
}

async function readSettings() {
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}

async function loadPlatformStatus() {
  let settings = await readSettings()
  if (settings && !settings.dating_launched_at) {
    // Opens dating once both targets are met (the SQL function only ever sets the timestamp).
    const { error } = await supabase.rpc('refresh_dating_launch')
    if (error) throw error
    settings = await readSettings()
  }

  const [maleCount, femaleCount] = await Promise.all([countUsers('male'), countUsers('female')])
  const maleTarget = settings?.male_target ?? env.LAUNCH_MALE_TARGET
  const femaleTarget = settings?.female_target ?? env.LAUNCH_FEMALE_TARGET
  const forced = env.FORCE_DATING_OPEN
  const datingLaunched = forced || Boolean(settings?.dating_launched_at)

  return {
    maleCount,
    femaleCount,
    otherCount: 0,
    maleTarget,
    femaleTarget,
    totalRegistered: maleCount + femaleCount,
    datingLaunched,
    datingLaunchedAt: settings?.dating_launched_at || null,
    forcedOpenLocally: forced,
    progressPercent: Math.min(
      100,
      Math.round(((Math.min(maleCount, maleTarget) / maleTarget + Math.min(femaleCount, femaleTarget) / femaleTarget) / 2) * 100)
    )
  }
}

export async function getPlatformStatus({ fresh = false } = {}) {
  if (!fresh && cached && cached.expires > Date.now()) return cached.value
  const value = await loadPlatformStatus()
  cached = { value, expires: Date.now() + STATUS_TTL_MS }
  return value
}

export async function assertDatingLaunched() {
  const status = await getPlatformStatus()
  if (!status.datingLaunched) {
    const error = new Error('Dating unlocks when we reach balanced registration targets.')
    error.code = 'DATING_LOCKED'
    throw error
  }
  return status
}

// Admin control: change targets and/or open or close dating by hand (e.g. for app-store reviewers).
export async function updatePlatformSettings({ maleTarget, femaleTarget, datingOpen }) {
  const updates = { updated_at: new Date().toISOString() }
  if (maleTarget !== undefined) updates.male_target = maleTarget
  if (femaleTarget !== undefined) updates.female_target = femaleTarget
  if (datingOpen === true) updates.dating_launched_at = new Date().toISOString()
  if (datingOpen === false) updates.dating_launched_at = null

  if (datingOpen === true) {
    const current = await readSettings()
    if (current?.dating_launched_at) delete updates.dating_launched_at
  }

  const { error } = await supabase.from('platform_settings').update(updates).eq('id', 1)
  if (error) throw error
  invalidatePlatformStatus()
  return getPlatformStatus({ fresh: true })
}
