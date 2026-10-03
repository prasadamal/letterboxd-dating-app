import { supabase } from '../supabaseClient.js'
import { logger } from '../lib/logger.js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

const EVENT_COPY = {
  new_match: {
    title: 'New ReelMates match',
    body: 'You matched with someone who shares your taste.'
  },
  new_message: {
    title: 'New message',
    body: 'Someone sent you a message on ReelMates.'
  },
  daily_game: {
    title: 'Daily taste game',
    body: 'Rate today’s films to keep your match score sharp.'
  }
}

async function loadPushTokens(userId) {
  const { data, error } = await supabase.from('push_tokens').select('token').eq('user_id', userId)
  if (error) throw error
  return (data || []).map((row) => row.token).filter(Boolean)
}

async function sendExpoPush(tokens, title, body, data = {}) {
  if (!tokens.length) return { delivered: 0, skipped: true }

  const payload = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data
  }))

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    logger.warn('Expo push failed', { status: response.status, text })
    return { delivered: 0, error: text }
  }

  const result = await response.json()
  await pruneDeadTokens(tokens, result?.data)
  return { delivered: tokens.length, result }
}

// Expo answers DeviceNotRegistered for uninstalled apps; stop sending to those tokens.
async function pruneDeadTokens(tokens, tickets) {
  if (!Array.isArray(tickets)) return
  const dead = tickets
    .map((ticket, index) => (ticket?.details?.error === 'DeviceNotRegistered' ? tokens[index] : null))
    .filter(Boolean)
  if (!dead.length) return
  const { error } = await supabase.from('push_tokens').delete().in('token', dead)
  if (error) logger.warn('Pruning dead push tokens failed', { error: error.message })
}

export async function unregisterPushToken(token) {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token)
  if (error) throw error
}

export async function registerPushToken(userId, token, platform) {
  // A device belongs to whoever signed in last on it.
  const { error: claimError } = await supabase.from('push_tokens').delete().eq('token', token).neq('user_id', userId)
  if (claimError) throw claimError

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      created_at: new Date().toISOString()
    },
    { onConflict: 'user_id,token' }
  )
  if (error) throw error
  return { ok: true }
}

export async function notifyUser(userId, event, payload = {}) {
  const copy = EVENT_COPY[event] || { title: 'ReelMates', body: 'You have a new update.' }
  const title = payload.title || copy.title
  const body = payload.body || copy.body

  try {
    const tokens = await loadPushTokens(userId)
    const result = await sendExpoPush(tokens, title, body, { event, ...payload })
    logger.info('Notification sent', { userId, event, delivered: result.delivered })
    return { queued: true, ...result }
  } catch (error) {
    logger.warn('Notification failed', { userId, event, error: error.message })
    return { queued: true, delivered: 0, error: error.message }
  }
}
