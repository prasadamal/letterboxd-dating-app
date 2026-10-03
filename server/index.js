import { createApp } from './createApp.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { seedMoviesIfEmpty } from './db.js'
import { syncPlatformTargets } from './platformService.js'

const app = createApp()

app.listen(env.PORT, async () => {
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
