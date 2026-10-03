import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { requestIdMiddleware } from './middleware/requestId.js'
import { applySecurityMiddleware, authRateLimiter } from './middleware/security.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { supabase } from './supabaseClient.js'

import authRoutes from './routes/auth.js'
import moviesRoutes from './routes/movies.js'
import matchesRoutes from './routes/matches.js'
import usersRoutes from './routes/users.js'
import messagesRoutes from './routes/messages.js'
import platformRoutes from './routes/platform.js'
import datingRoutes from './routes/dating.js'
import safetyRoutes from './routes/safety.js'
import notificationsRoutes from './routes/notifications.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createApp() {
  const app = express()
  const distPath = path.join(__dirname, '..', 'dist')
  const isProduction = env.NODE_ENV === 'production'

  app.use(requestIdMiddleware)
  app.use((req, res, next) => {
    req.log = logger.child({ requestId: req.requestId })
    next()
  })

  applySecurityMiddleware(app)

  app.use(
    cors({
      origin: env.CLIENT_URL || (isProduction ? false : '*'),
      credentials: true
    })
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))

  async function healthPayload() {
    const { error } = await supabase.from('platform_settings').select('id').limit(1)
    return {
      ok: !error,
      status: error ? 'degraded' : 'healthy',
      env: env.NODE_ENV,
      version: 'v1',
      db: error ? 'down' : 'up',
      time: new Date().toISOString()
    }
  }

  app.get('/api/health', async (req, res) => {
    res.json(await healthPayload())
  })

  app.get('/api/v1/health', async (req, res) => {
    res.json(await healthPayload())
  })

  app.get('/api/v1/health/db', async (req, res) => {
    const { error } = await supabase.from('users').select('id').limit(1)
    res.status(error ? 503 : 200).json({ ok: !error, db: error ? 'down' : 'up' })
  })

  app.get('/api/v1/health/storage', async (req, res) => {
    const { data, error } = await supabase.storage.from('avatars').list('', { limit: 1 })
    res.status(error ? 503 : 200).json({ ok: !error, storage: error ? 'down' : 'up', sample: (data || []).length })
  })

  app.get('/api/v1/openapi.json', (req, res) => {
    res.json({
      openapi: '3.0.3',
      info: { title: 'ReelMates API', version: '1.0.0' },
      paths: {
        '/api/v1/auth/signup': { post: { summary: 'Register' } },
        '/api/v1/auth/login': { post: { summary: 'Login' } },
        '/api/v1/platform/status': { get: { summary: 'Launch counters' } },
        '/api/v1/movies/daily': { get: { summary: 'Daily taste game films' } },
        '/api/v1/dating/deck': { get: { summary: 'Dating profile card' } }
      }
    })
  })

  const mount = (prefix) => {
    app.use(`${prefix}/auth`, authRateLimiter(), authRoutes)
    app.use(`${prefix}/movies`, moviesRoutes)
    app.use(`${prefix}/matches`, matchesRoutes)
    app.use(`${prefix}/users`, usersRoutes)
    app.use(`${prefix}/messages`, messagesRoutes)
    app.use(`${prefix}/platform`, platformRoutes)
    app.use(`${prefix}/dating`, datingRoutes)
    app.use(`${prefix}/safety`, safetyRoutes)
    app.use(`${prefix}/notifications`, notificationsRoutes)
  }

  mount('/api/v1')
  mount('/api')

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      return res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
