import test from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'
process.env.RATE_LIMIT_MAX = '6'
process.env.RATE_LIMIT_USER_MAX = '8'
process.env.AUTH_RATE_LIMIT_MAX = '2'
process.env.AUTH_IP_RATE_LIMIT_MAX = '4'

const { default: express } = await import('express')
const { applySecurityMiddleware, authRateLimiter } = await import('../middleware/security.js')
const { signToken } = await import('../middleware/auth.js')

test('limits count per account for signed-in people, per address otherwise, and never touch health checks', async () => {
  const app = express()
  app.use(express.json())
  applySecurityMiddleware(app)
  app.get('/api/v1/health', (_req, res) => res.json({ ok: true }))
  app.get('/api/v1/thing', (_req, res) => res.json({ ok: true }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/api/v1`
  const get = (path, token) => fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.status)
  const statuses = async (n, fn) => { const out = []; for (let i = 0; i < n; i++) out.push(await fn()); return out }
  try {
    // Health checks are never limited.
    assert.deepEqual(await statuses(8, () => get('/health')), Array(8).fill(200))

    // Anonymous requests from one address share one budget (6).
    assert.deepEqual(await statuses(7, () => get('/thing')), [...Array(6).fill(200), 429])

    // Two signed-in people on that same, exhausted address each get their own budget (8).
    const alice = signToken({ id: 'alice', authVersion: 0 })
    const bob = signToken({ id: 'bob', authVersion: 0 })
    assert.deepEqual(await statuses(9, () => get('/thing', alice)), [...Array(8).fill(200), 429])
    assert.deepEqual(await statuses(8, () => get('/thing', bob)), Array(8).fill(200))
    // A forged token does not get a fresh budget: it counts as the (exhausted) address.
    assert.equal(await get('/thing', 'not.a.real.token'), 429)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('sign-in attempts are limited per address and email, with a looser cap per address', async () => {
  const app = express()
  app.use(express.json())
  applySecurityMiddleware(app)
  app.post('/api/v1/auth/login', authRateLimiter(), (_req, res) => res.json({ ok: true }))
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const url = `http://127.0.0.1:${server.address().port}/api/v1/auth/login`
  const login = (email) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'x' }) }).then((r) => r.status)
  try {
    // 2 tries per address and email (case and spaces ignored)...
    assert.equal(await login('a@example.com'), 200)
    assert.equal(await login(' A@Example.com'), 200)
    assert.equal(await login('a@example.com'), 429)
    // ...other accounts from the same address still work, until the address cap (4 counted tries) is reached.
    assert.equal(await login('b@example.com'), 200)
    assert.equal(await login('c@example.com'), 200)
    assert.equal(await login('d@example.com'), 429)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
