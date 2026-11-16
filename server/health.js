/** Readiness is deliberately distinct from process liveness. Never return 200 for a failed database. */
export function createHealthHandler({ database, configuration, missingConfig, timeoutMs = 3000 }) {
  return async (_req, res) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    let healthy = false
    try {
      const { error } = await database.from('platform_settings').select('id').limit(1).abortSignal(controller.signal)
      healthy = !error
    } catch {
      healthy = false
    } finally {
      clearTimeout(timeout)
    }
    res.status(healthy ? 200 : 503).json({
      ok: healthy,
      status: healthy ? 'healthy' : 'degraded',
      env: configuration.NODE_ENV,
      version: 'v1',
      db: healthy ? 'up' : 'down',
      email: configuration.RESEND_API_KEY && configuration.EMAIL_FROM ? 'configured' : 'not_configured',
      setup: missingConfig(configuration).map(item => item.split(':')[0]),
      time: new Date().toISOString()
    })
  }
}
