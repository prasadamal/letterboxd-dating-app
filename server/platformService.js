import { supabase } from './supabaseClient.js'
import { env } from './config/env.js'
import { canonicalCity, cityKey, cityProgress, publicCityProgress } from './lib/cityLaunch.js'

// Every open app polls the launch status, so serve it from memory for a short while.
const STATUS_TTL_MS = 15_000
let cached = null
let boardCache = null

export function invalidatePlatformStatus() {
  cached = null
  boardCache = null
}

// Creates the settings row on an empty database. Never overwrites it: the launch is changed from /admin,
// so a local API pointed at the shared database can't move the production launch.
export async function ensurePlatformSettings() {
  const { error } = await supabase
    .from('platform_settings')
    .upsert({ id: 1, updated_at: new Date().toISOString() }, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw error
}

async function readSettings() {
  const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw error
  return data
}

// Dating is opened everywhere only by an admin (or FORCE_DATING_OPEN on a local API); otherwise city by city.
async function loadPlatformStatus() {
  const settings = await readSettings()
  const forced = env.FORCE_DATING_OPEN
  return {
    openEverywhere: forced || Boolean(settings?.dating_launched_at),
    openedEverywhereAt: settings?.dating_launched_at || null,
    forcedOpenLocally: forced,
    cityTarget: settings?.city_target ?? 150,
    openCities: settings?.open_cities || []
  }
}

export async function getPlatformStatus({ fresh = false } = {}) {
  if (!fresh && cached && cached.expires > Date.now()) return cached.value
  const value = await loadPlatformStatus()
  cached = { value, expires: Date.now() + STATUS_TTL_MS }
  return value
}

// Women and men who want to date, per city (SQL function city_dating_counts), plus admin-opened cities.
async function loadCityBoard(status) {
  const { data, error } = await supabase.rpc('city_dating_counts')
  if (error) throw error
  const byKey = new Map()
  for (const row of data || []) {
    const progress = cityProgress({
      city: row.city,
      country: row.country,
      femaleCount: Number(row.women) || 0,
      maleCount: Number(row.men) || 0,
      cityTarget: status.cityTarget,
      openCities: status.openCities
    })
    if (!progress.key) continue
    // Spellings that only differ in case were grouped by SQL; aliases ("Cochin") are merged here.
    const prev = byKey.get(progress.key)
    byKey.set(
      progress.key,
      prev
        ? cityProgress({
            city: progress.name,
            country: progress.country,
            femaleCount: prev.femaleCount + progress.femaleCount,
            maleCount: prev.maleCount + progress.maleCount,
            cityTarget: status.cityTarget,
            openCities: status.openCities
          })
        : progress
    )
  }
  return [...byKey.values()].sort((a, b) => b.progressPercent - a.progressPercent || a.name.localeCompare(b.name))
}

export async function getCityBoard({ fresh = false } = {}) {
  if (!fresh && boardCache && boardCache.expires > Date.now()) return boardCache.value
  const status = await getPlatformStatus({ fresh })
  const value = await loadCityBoard(status)
  boardCache = { value, expires: Date.now() + STATUS_TTL_MS }
  return value
}

export async function getCityProgress(city, country) {
  const key = cityKey(city, country)
  if (!key) return null
  const [status, board] = await Promise.all([getPlatformStatus(), getCityBoard()])
  return (
    board.find((c) => c.key === key) ||
    cityProgress({ city, country, cityTarget: status.cityTarget, openCities: status.openCities })
  )
}

export async function getOpenCityKeys() {
  const [status, board] = await Promise.all([getPlatformStatus(), getCityBoard()])
  const keys = new Set(board.filter((c) => c.open).map((c) => c.key))
  // Admin-opened cities with no members yet are open too; "City, Country" entries can be keyed directly.
  for (const entry of status.openCities) {
    const [entryCity, ...rest] = String(entry).split(',')
    const key = cityKey(entryCity, rest.join(','))
    if (key) keys.add(key)
  }
  return keys
}

// The public "unlock your city" board: percentages only, and only cities with a few members so nobody is singled out.
export async function getPublicCityBoard({ limit = 30 } = {}) {
  const board = await getCityBoard()
  return board
    .filter((c) => c.open || c.femaleCount + c.maleCount >= 5)
    .slice(0, limit)
    .map(publicCityProgress)
}

async function hasAnyMatch(userId) {
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
  if (error) throw error
  return (count || 0) > 0
}

// Status as one member sees it. `datingLaunched` is true when dating is open for them: everywhere (admin) or in
// their city. `needsCity` asks the app to collect a city. `includeMatches` adds hasMatches, which keeps Chats
// visible for people who paused dating.
export async function getPlatformStatusForUser(user, { includeMatches = false } = {}) {
  const status = await getPlatformStatus()
  const city = user?.city && user?.country ? await getCityProgress(user.city, user.country) : null
  return {
    openEverywhere: status.openEverywhere,
    cityTarget: status.cityTarget,
    datingLaunched: status.openEverywhere || Boolean(city?.open),
    city: publicCityProgress(city),
    needsCity: !city,
    ...(includeMatches && user?.id ? { hasMatches: await hasAnyMatch(user.id) } : {})
  }
}

export async function assertDatingLaunched(user) {
  const status = await getPlatformStatusForUser(user)
  if (!status.datingLaunched) {
    const error = new Error(
      status.needsCity
        ? 'Add your city in Settings: dating opens city by city.'
        : `Dating opens in ${status.city.name} once enough people join. Keep playing the daily films meanwhile.`
    )
    error.code = 'DATING_LOCKED'
    throw error
  }
  return status
}

// Admin: change the city target, open cities by hand, or open/close dating everywhere (e.g. for app-store reviewers).
export async function updatePlatformSettings({ datingOpen, cityTarget, openCities }) {
  const updates = { updated_at: new Date().toISOString() }
  if (cityTarget !== undefined) updates.city_target = cityTarget
  if (openCities !== undefined) {
    updates.open_cities = [
      ...new Set(
        openCities
          .map((entry) => {
            const [entryCity, ...rest] = String(entry).split(',')
            const country = rest.join(',').trim().replace(/\s+/g, ' ')
            const city = canonicalCity(entryCity)
            return city ? (country ? `${city}, ${country}` : city) : ''
          })
          .filter(Boolean)
      )
    ]
  }
  if (datingOpen === false) updates.dating_launched_at = null
  if (datingOpen === true) {
    const current = await readSettings()
    if (!current?.dating_launched_at) updates.dating_launched_at = new Date().toISOString()
  }

  const { error } = await supabase.from('platform_settings').update(updates).eq('id', 1)
  if (error) throw error
  invalidatePlatformStatus()
  return getAdminPlatform()
}

// Admin view: settings plus every city with its counts.
export async function getAdminPlatform() {
  const status = await getPlatformStatus({ fresh: true })
  return { ...status, cities: await getCityBoard({ fresh: true }) }
}
