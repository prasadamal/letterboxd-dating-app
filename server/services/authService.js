import crypto from 'crypto'
import { supabase } from '../supabaseClient.js'
import { env } from '../config/env.js'

const REFRESH_TTL_DAYS = 30

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export async function issueRefreshToken(userId) {
  const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET
  const raw = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86400000).toISOString()

  const { error } = await supabase.from('refresh_tokens').insert({
    user_id: userId,
    token_hash: hash(`${raw}:${secret}`),
    expires_at: expiresAt
  })

  if (error) throw error
  return { refreshToken: raw, expiresAt }
}

export async function rotateRefreshToken(rawToken) {
  const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET
  const tokenHash = hash(`${rawToken}:${secret}`)

  const { data, error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const next = await issueRefreshToken(data.user_id)
  return { ...next, userId: data.user_id }
}

export async function revokeRefreshToken(rawToken) {
  const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET
  const tokenHash = hash(`${rawToken}:${secret}`)
  const { error } = await supabase.from('refresh_tokens').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash)
  if (error) throw error
}

export async function revokeAllRefreshTokens(userId) {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null)
  if (error) throw error
}
