import { supabase } from '../supabaseClient.js'

const BUCKET = 'avatars'

// The bucket is public, so only accept bytes that really are the image type the client claims.
export function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  return null
}

async function listUserAvatarPaths(userId) {
  const { data, error } = await supabase.storage.from(BUCKET).list(userId, { limit: 100 })
  if (error) throw error
  return (data || []).map((file) => `${userId}/${file.name}`)
}

export async function removeUserAvatars(userId, keepPath = null) {
  const paths = (await listUserAvatarPaths(userId)).filter((path) => path !== keepPath)
  if (!paths.length) return 0
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw error
  return paths.length
}

export async function uploadAvatar(userId, buffer, contentType) {
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: true
  })

  if (uploadError) throw uploadError

  // Only one avatar per user is ever shown; drop the previous uploads.
  await removeUserAvatars(userId, path).catch(() => 0)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
