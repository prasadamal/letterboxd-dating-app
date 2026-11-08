import crypto from 'crypto'
import { supabase } from '../supabaseClient.js'
import { env } from '../config/env.js'

const REFRESH_TTL_DAYS = 30

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function newRefreshToken() {
  const raw = crypto.randomBytes(48).toString('hex')
  return {
    raw,
    tokenHash: hash(`${raw}:${env.JWT_REFRESH_SECRET || env.JWT_SECRET}`),
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86400000).toISOString()
  }
}

export async function issueRefreshToken(userId, authVersion) {
  const next = newRefreshToken()
  const { data, error } = await supabase.rpc('issue_refresh_token', {
    p_user_id: userId, p_auth_version: authVersion,
    p_token_hash: next.tokenHash, p_expires_at: next.expiresAt
  })
  if (error) throw error
  if (!data) throw Object.assign(new Error('Session changed. Please sign in again.'), { status: 401, code: 'INVALID_REFRESH' })
  return { refreshToken: next.raw, expiresAt: next.expiresAt }
}

export async function rotateRefreshToken(rawToken) {
  const next = newRefreshToken()
  const { data, error } = await supabase.rpc('rotate_refresh_token', {
    p_token_hash: hash(`${rawToken}:${env.JWT_REFRESH_SECRET || env.JWT_SECRET}`),
    p_next_hash: next.tokenHash, p_expires_at: next.expiresAt
  })
  if (error) throw error
  const row = data?.[0]
  if (!row) return null
  return { refreshToken: next.raw, expiresAt: next.expiresAt, userId: row.user_id, authVersion: row.auth_version }
}

export async function revokeRefreshToken(rawToken, userId) {
  if (!userId) throw new Error('Refresh token owner required')
  const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET
  const tokenHash = hash(`${rawToken}:${secret}`)
  const { error } = await supabase.from('refresh_tokens').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash).eq('user_id', userId)
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
