import { supabase } from '../supabaseClient.js'
import { findUserById } from '../db.js'

export async function setUserVerification(userId, status, notes = '') {
  const allowed = ['unverified', 'pending', 'verified', 'rejected']
  if (!allowed.includes(status)) throw new Error('Invalid verification status')

  const user = await findUserById(userId)
  if (!user) throw new Error('User not found')

  const patch = {
    verification_status: status,
    verification_notes: notes ? String(notes).slice(0, 500) : null,
    verified_at: status === 'verified' ? new Date().toISOString() : null
  }

  const { data, error } = await supabase.from('users').update(patch).eq('id', userId).select('id, verification_status, verified_at').single()
  if (error) throw error
  return data
}
