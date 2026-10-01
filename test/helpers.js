import './setup.js'
import { createApp } from '../server/app.js'
import { resetStore } from '../server/db.js'

/** Start a fresh app on an ephemeral port with a freshly seeded in-memory store. */
export async function startServer() {
  resetStore()
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`

  async function request(method, path, { token, body, headers } = {}) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    })
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = undefined }
    return { status: res.status, headers: res.headers, text, json }
  }

  async function login(email = 'maya@example.com', password = '123456') {
    const res = await request('POST', '/api/auth/login', { body: { email, password } })
    return res.json?.token
  }

  async function signup(overrides = {}) {
    const unique = Math.random().toString(36).slice(2, 10)
    const body = { email: `user-${unique}@example.com`, password: 'secret12', name: 'Test User', age: 30, city: 'Paris', ...overrides }
    const res = await request('POST', '/api/auth/signup', { body })
    return { ...res, body }
  }

  return { base, request, login, signup, close: () => new Promise((resolve) => { server.close(resolve); server.closeAllConnections?.() }) }
}
