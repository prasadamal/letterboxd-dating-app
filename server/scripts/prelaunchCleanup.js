// Run once before going public: removes demo and test accounts and closes the launch gate again.
//
//   npm run db:prelaunch-cleanup                               # dry run: shows what would change
//   npm run db:prelaunch-cleanup -- --yes                      # delete demo users, reset the gate
//   npm run db:prelaunch-cleanup -- --yes --emails a@x.com,b@y.com --male-target 500 --female-target 500
import dotenv from 'dotenv'

dotenv.config()

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : undefined
}

const apply = flag('yes')
const extraEmails = (option('emails') || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
const maleTarget = option('male-target') ? Number(option('male-target')) : undefined
const femaleTarget = option('female-target') ? Number(option('female-target')) : undefined

const { supabase } = await import('../supabaseClient.js')
const { deleteUserAccount } = await import('../safetyService.js')

const { data: demoUsers, error: demoError } = await supabase.from('users').select('id, email').eq('is_demo', true)
if (demoError) throw demoError

let testUsers = []
if (extraEmails.length) {
  const { data, error } = await supabase.from('users').select('id, email').in('email', extraEmails).is('deleted_at', null)
  if (error) throw error
  testUsers = data || []
  const found = new Set(testUsers.map((user) => user.email))
  for (const email of extraEmails) if (!found.has(email)) console.log(`  (not found) ${email}`)
}

const targets = [...new Map([...demoUsers, ...testUsers].map((user) => [user.id, user])).values()]
const { data: settings } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()

console.log(apply ? 'Applying pre-launch cleanup:' : 'Dry run (add --yes to apply):')
console.log(`  accounts to delete: ${targets.length}`)
for (const user of targets) console.log(`    - ${user.email}`)
console.log(`  dating_launched_at: ${settings?.dating_launched_at || 'null'} -> null`)
if (maleTarget || femaleTarget) {
  console.log(`  targets: ${settings?.male_target}/${settings?.female_target} -> ${maleTarget ?? settings?.male_target}/${femaleTarget ?? settings?.female_target}`)
}

if (!apply) process.exit(0)

for (const user of targets) {
  await deleteUserAccount(user.id)
  // Demo and test rows need no tombstone. Foreign keys cascade, so this also drops any reports about them.
  const { error } = await supabase.from('users').delete().eq('id', user.id)
  if (error) throw error
  console.log(`  deleted ${user.email}`)
}

const updates = { dating_launched_at: null, updated_at: new Date().toISOString() }
if (maleTarget) updates.male_target = maleTarget
if (femaleTarget) updates.female_target = femaleTarget
const { error: settingsError } = await supabase.from('platform_settings').update(updates).eq('id', 1)
if (settingsError) throw settingsError

console.log('Done. Restart the API (or wait 15 seconds) for the launch status to refresh.')
