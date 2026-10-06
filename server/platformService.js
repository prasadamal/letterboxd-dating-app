import { supabase } from './supabaseClient.js'
import { env } from './config/env.js'
import { countryProgress, ilikeExact, normalizeCountry } from './lib/regionLaunch.js'

// Every open app polls the launch status, so serve it from memory for a short while.
const STATUS_TTL_MS = 15_000
let cached = null

const countryCache = new Map()

export function invalidatePlatformStatus() {
  cached = null
  countryCache.clear()
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

// Launch counts are about the dating pool, so only people who switched dating on count.
async function countUsers(gender, country) {
  let query = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('gender', gender)
    .eq('dating_enabled', true)
    .is('deleted_at', null)
  if (country !== undefined) query = query.ilike('country', ilikeExact(country))
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

async function countOthers() {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('gender', ['nonbinary', 'other'])
    .eq('dating_enabled', true)
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

  const [maleCount, femaleCount, otherCount] = await Promise.all([countUsers('male'), countUsers('female'), countOthers()])
  const maleTarget = settings?.male_target ?? env.LAUNCH_MALE_TARGET
  const femaleTarget = settings?.female_target ?? env.LAUNCH_FEMALE_TARGET
  const forced = env.FORCE_DATING_OPEN
  const datingLaunched = forced || Boolean(settings?.dating_launched_at)

  return {
    maleCount,
    femaleCount,
    otherCount,
    maleTarget,
    femaleTarget,
    totalRegistered: maleCount + femaleCount + otherCount,
    countryTarget: settings?.country_target ?? 150,
    openCountries: settings?.open_countries || [],
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

async function loadCountryProgress(country, status) {
  const [maleCount, femaleCount] = await Promise.all([countUsers('male', country), countUsers('female', country)])
  return countryProgress({
    country,
    maleCount,
    femaleCount,
    countryTarget: status.countryTarget,
    openCountries: status.openCountries
  })
}

export async function getCountryProgress(country) {
  const key = normalizeCountry(country)
  if (!key) return null
  const status = await getPlatformStatus()
  const hit = countryCache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value
  const value = await loadCountryProgress(country, status)
  countryCache.set(key, { value, expires: Date.now() + STATUS_TTL_MS })
  return value
}

async function hasAnyMatch(userId) {
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
  if (error) throw error
  return (count || 0) > 0
}

// Status as one member sees it: dating is open for them when it is open everywhere or in their country.
// `regionOnly` means the deck is limited to people in the same country. `includeMatches` adds hasMatches,
// which the app uses to keep Chats visible for people who paused dating.
export async function getPlatformStatusForUser(user, { includeMatches = false } = {}) {
  const status = await getPlatformStatus()
  const country = user?.country ? await getCountryProgress(user.country) : null
  const regionOpen = Boolean(country?.open)
  return {
    ...status,
    globalLaunched: status.datingLaunched,
    datingLaunched: status.datingLaunched || regionOpen,
    regionOnly: !status.datingLaunched && regionOpen,
    country,
    ...(includeMatches && user?.id ? { hasMatches: await hasAnyMatch(user.id) } : {})
  }
}

export async function assertDatingLaunched(user) {
  const status = user ? await getPlatformStatusForUser(user) : await getPlatformStatus()
  if (!status.datingLaunched) {
    const error = new Error('Dating unlocks when we reach balanced registration targets.')
    error.code = 'DATING_LOCKED'
    throw error
  }
  return status
}

// Admin control: change targets and/or open or close dating by hand (e.g. for app-store reviewers).
export async function updatePlatformSettings({ maleTarget, femaleTarget, datingOpen, countryTarget, openCountries }) {
  const updates = { updated_at: new Date().toISOString() }
  if (maleTarget !== undefined) updates.male_target = maleTarget
  if (femaleTarget !== undefined) updates.female_target = femaleTarget
  if (countryTarget !== undefined) updates.country_target = countryTarget
  if (openCountries !== undefined) {
    updates.open_countries = [...new Set(openCountries.map((c) => c.trim().replace(/\s+/g, ' ')).filter(Boolean))]
  }
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
