import { supabase } from './supabaseClient.js'

const DEFAULT_MALE_TARGET = Number(process.env.LAUNCH_MALE_TARGET || 500)
const DEFAULT_FEMALE_TARGET = Number(process.env.LAUNCH_FEMALE_TARGET || 500)

export async function syncPlatformTargets() {
  await supabase
    .from('platform_settings')
    .upsert(
      {
        id: 1,
        male_target: DEFAULT_MALE_TARGET,
        female_target: DEFAULT_FEMALE_TARGET,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
}

export async function getPlatformStatus() {
  await syncPlatformTargets()
  await supabase.rpc('refresh_dating_launch')

  const { data: settings, error: settingsError } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (settingsError) throw settingsError

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('gender')
    .is('deleted_at', null)

  if (usersError) throw usersError

  let maleCount = 0
  let femaleCount = 0
  let otherCount = 0

  for (const row of users || []) {
    if (row.gender === 'male') maleCount += 1
    else if (row.gender === 'female') femaleCount += 1
    else otherCount += 1
  }

  const maleTarget = settings?.male_target ?? DEFAULT_MALE_TARGET
  const femaleTarget = settings?.female_target ?? DEFAULT_FEMALE_TARGET
  const datingLaunched = Boolean(settings?.dating_launched_at)

  return {
    maleCount,
    femaleCount,
    otherCount,
    maleTarget,
    femaleTarget,
    totalRegistered: (users || []).length,
    datingLaunched,
    datingLaunchedAt: settings?.dating_launched_at || null,
    progressPercent: Math.min(
      100,
      Math.round(((maleCount / maleTarget + femaleCount / femaleTarget) / 2) * 100)
    )
  }
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
