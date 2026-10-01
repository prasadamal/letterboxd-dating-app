import 'dotenv/config'
import { getJwtSecret } from './config.js'
import app from './app.js'

// Fail fast (in production) or warn (in development) about an insecure JWT secret before accepting traffic.
getJwtSecret()

const port = Number(process.env.PORT || 4000)

const server = app.listen(port, () => {
  console.log(`ReelMates backend running on http://localhost:${port} (${process.env.NODE_ENV || 'development'})`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
