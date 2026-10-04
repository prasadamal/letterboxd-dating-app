import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { env, missingProductionConfig } from './config/env.js'
import { logger } from './lib/logger.js'
import { requestIdMiddleware } from './middleware/requestId.js'
import { applySecurityMiddleware } from './middleware/security.js'
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
import adminRoutes from './routes/admin.js'
import internalRoutes from './routes/internal.js'
import { openApiDocument } from './openapi/spec.js'
import swaggerUi from 'swagger-ui-express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createApp() {
  const app = express()
  const distPath = path.join(__dirname, '..', 'dist')
  const isProduction = env.NODE_ENV === 'production'

  // Behind a hosting proxy every request would otherwise share the proxy's IP and one rate-limit bucket.
  app.set('trust proxy', env.TRUST_PROXY ?? (isProduction ? 1 : 0))

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
  // Avatar uploads arrive base64-encoded (~4/3 of the 2.5MB image cap); everything else stays small.
  app.use(['/api/users/avatar', '/api/v1/users/avatar'], express.json({ limit: '4mb' }))
  app.use(express.json({ limit: '200kb' }))
  app.use(express.urlencoded({ extended: true }))

  async function healthPayload() {
    const { error } = await supabase.from('platform_settings').select('id').limit(1)
    // `setup` lists features that are switched off until their env vars are set (no secrets are shown).
    return {
      ok: !error,
      status: error ? 'degraded' : 'healthy',
      env: env.NODE_ENV,
      version: 'v1',
      db: error ? 'down' : 'up',
      email: env.RESEND_API_KEY && env.EMAIL_FROM ? 'configured' : 'not_configured',
      setup: missingProductionConfig(env).map((item) => item.split(':')[0]),
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
    res.json(openApiDocument)
  })

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'ReelMates API' }))
  app.get('/api/openapi.json', (req, res) => res.json(openApiDocument))
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: 'ReelMates API' }))

  const mount = (prefix) => {
    app.use(`${prefix}/auth`, authRoutes)
    app.use(`${prefix}/movies`, moviesRoutes)
    app.use(`${prefix}/matches`, matchesRoutes)
    app.use(`${prefix}/users`, usersRoutes)
    app.use(`${prefix}/messages`, messagesRoutes)
    app.use(`${prefix}/platform`, platformRoutes)
    app.use(`${prefix}/dating`, datingRoutes)
    app.use(`${prefix}/safety`, safetyRoutes)
    app.use(`${prefix}/notifications`, notificationsRoutes)
    app.use(`${prefix}/admin`, adminRoutes)
    app.use(`${prefix}/internal`, internalRoutes)
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
