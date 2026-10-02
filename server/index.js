import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import authRoutes from './routes/auth.js'
import moviesRoutes from './routes/movies.js'
import matchesRoutes from './routes/matches.js'
import usersRoutes from './routes/users.js'
import messagesRoutes from './routes/messages.js'
import platformRoutes from './routes/platform.js'
import datingRoutes from './routes/dating.js'
import safetyRoutes from './routes/safety.js'
import { seedMoviesIfEmpty } from './db.js'
import { syncPlatformTargets } from './platformService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isProduction = process.env.NODE_ENV === 'production'
const distPath = path.join(__dirname, '..', 'dist')

const app = express()
const port = Number(process.env.PORT || 4000)

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-this-secret-for-production')) {
  console.error('Set a strong JWT_SECRET before running in production.')
  process.exit(1)
}

app.use(cors({ origin: process.env.CLIENT_URL || (isProduction ? false : '*'), credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', env: process.env.NODE_ENV || 'development' })
})

app.use('/api/auth', authRoutes)
app.use('/api/movies', moviesRoutes)
app.use('/api/matches', matchesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/platform', platformRoutes)
app.use('/api/dating', datingRoutes)
app.use('/api/safety', safetyRoutes)

if (isProduction && fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    return res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' })
})

app.listen(port, async () => {
  try {
    await syncPlatformTargets()
    const result = await seedMoviesIfEmpty()
    if (result.seeded) {
      console.log(`Seeded ${result.seeded} movies into Supabase`)
    }
  } catch (error) {
    console.error('Movie seed failed:', error.message)
  }

  console.log(`ReelMates backend running on http://localhost:${port}`)
})
