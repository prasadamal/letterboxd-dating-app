import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import authRoutes from './routes/auth.js'
import moviesRoutes from './routes/movies.js'
import matchesRoutes from './routes/matches.js'
import usersRoutes from './routes/users.js'

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' })
})

app.use('/api/auth', authRoutes)
app.use('/api/movies', moviesRoutes)
app.use('/api/matches', matchesRoutes)
app.use('/api/users', usersRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' })
})

app.listen(port, () => {
  console.log(`ReelMates backend running on http://localhost:${port}`)
})
