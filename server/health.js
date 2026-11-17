/** Readiness is deliberately distinct from process liveness. Never return 200 for a failed database. */
export function createHealthHandler({ database, configuration, missingConfig, timeoutMs = 3000 }) {
  return async (_req, res) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    let healthy = false
    let schemaCurrent = true
    try {
      const { error } = await database.from('platform_settings').select('id').limit(1).abortSignal(controller.signal)
      healthy = !error
      if (healthy) {
        // Sign-in needs the newest auth migration. Until it is applied the service reports not ready,
        // so the host keeps the previous version live instead of one where nobody can log in.
        const schema = await database.from('users').select('auth_version').limit(1).abortSignal(controller.signal)
        schemaCurrent = !schema.error
        healthy = schemaCurrent
      }
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
      db: healthy ? 'up' : schemaCurrent ? 'down' : 'migration_pending',
      email: configuration.RESEND_API_KEY && configuration.EMAIL_FROM ? 'configured' : 'not_configured',
      setup: missingConfig(configuration).map(item => item.split(':')[0]),
      time: new Date().toISOString()
    })
  }
}
