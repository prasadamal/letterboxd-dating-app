import { supabase } from '../supabaseClient.js'

export async function uploadAvatar(userId, buffer, contentType) {
  const ext = contentType.includes('png') ? 'png' : 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, buffer, {
    contentType,
    upsert: true
  })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
