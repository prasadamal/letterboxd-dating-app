import { env } from '../config/env.js'
import { logger } from './logger.js'

export function captureException(error, context = {}) {
  logger.error('exception', {
    message: error?.message,
    stack: error?.stack,
    ...context,
    sentryConfigured: Boolean(env.SENTRY_DSN)
  })
}

export async function trackEvent(event, properties = {}, distinctId = null) {
  logger.info('analytics_event', { event, properties, distinctId })

  if (!env.POSTHOG_API_KEY) return { ok: true, delivered: false }

  const host = env.POSTHOG_HOST || 'https://app.posthog.com'
  try {
    const response = await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: env.POSTHOG_API_KEY,
        event,
        properties: { ...properties, distinct_id: distinctId || 'server' }
      })
    })
    return { ok: response.ok, delivered: response.ok }
  } catch (error) {
    logger.warn('posthog capture failed', { message: error.message })
    return { ok: false, delivered: false }
  }
}
