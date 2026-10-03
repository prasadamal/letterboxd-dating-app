import { createApp } from './createApp.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { seedMoviesIfEmpty } from './db.js'
import { syncPlatformTargets } from './platformService.js'

const app = createApp()

const server = app.listen(env.PORT, async () => {
  try {
    await syncPlatformTargets()
    const result = await seedMoviesIfEmpty()
    if (result.seeded) {
      logger.info('Seeded movies', { count: result.seeded })
    }
  } catch (error) {
    logger.error('Startup seed failed', { error: error.message })
  }

  logger.info('ReelMates API listening', { port: env.PORT, env: env.NODE_ENV })
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
