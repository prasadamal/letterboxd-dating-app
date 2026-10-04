import { createApp } from './createApp.js'
import { env, missingProductionConfig } from './config/env.js'
import { logger } from './lib/logger.js'
import { seedMoviesIfEmpty } from './db.js'
import { ensurePlatformSettings } from './platformService.js'

const app = createApp()

const server = app.listen(env.PORT, async () => {
  try {
    await ensurePlatformSettings()
    const result = await seedMoviesIfEmpty()
    if (result.seeded) {
      logger.info('Seeded movies', { count: result.seeded })
    }
  } catch (error) {
    logger.error('Startup seed failed', { error: error.message })
  }

  logger.info('ReelMates API listening', { port: env.PORT, env: env.NODE_ENV })
  if (env.FORCE_DATING_OPEN) logger.warn('FORCE_DATING_OPEN is on: this instance reports dating as open (local testing only)')
  if (env.NODE_ENV === 'production') {
    for (const item of missingProductionConfig(env)) logger.warn(`Not configured: ${item}`)
  }
})

// Hosts send SIGTERM on every deploy: stop accepting connections and let in-flight requests finish.
function shutdown(signal) {
  logger.info('Shutting down', { signal })
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason instanceof Error ? reason.message : String(reason) })
})
