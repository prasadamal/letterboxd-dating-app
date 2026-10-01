import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'

import { isProduction, getAllowedOrigins } from './config.js'
import authRoutes from './routes/auth.js'
import moviesRoutes from './routes/movies.js'
import matchesRoutes from './routes/matches.js'
import usersRoutes from './routes/users.js'
import messagesRoutes from './routes/messages.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist')

/** Build the Express app without listening, so tests can mount it on an ephemeral port. */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY)

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })

  // Only the configured origins may call the API from a browser. Bearer tokens are used, not cookies.
  app.use('/api', cors({ origin: getAllowedOrigins(), methods: ['GET', 'POST', 'PUT', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, status: 'healthy' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/movies', moviesRoutes)
  app.use('/api/matches', matchesRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/messages', messagesRoutes)

  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' })
  })

  // Single-process production launch: serve the built SPA from dist/.
  if (isProduction() && fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir, { index: false, maxAge: '1h' }))
    app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
  } else if (isProduction()) {
    console.warn('[server] NODE_ENV=production but dist/ was not found; run `npm run build` first. Only the API is available.')
  }

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found' })
  })

  // Global error handler (must have 4 args). Never leaks stack traces to clients.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' })
    if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large' })
    if (err.message === 'Not allowed by CORS') return res.status(403).json({ message: 'Origin not allowed' })
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500
    if (status >= 500) console.error('[server] Unhandled error:', err)
    return res.status(status).json({ message: status >= 500 ? 'Internal server error' : err.message })
  })

  return app
}

export default createApp()
