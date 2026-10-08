const API_BASE = '/api'
const TOKEN_KEY = 'reelmates_token'
const REFRESH_KEY = 'reelmates_refresh'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setSession(token, refreshToken) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function setToken(token) {
  setSession(token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function errorMessage(error) {
  return error?.message || 'Request failed'
}

let refreshInFlight = null

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    if (!res.ok) {
      clearToken()
      return null
    }
    const data = await res.json()
    setSession(data.token, data.refreshToken)
    return data.token
  })()
  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function apiFetch(path, options = {}, token = getToken()) {
  const skipRefresh = path.startsWith('/auth/refresh') || path.startsWith('/auth/login') || path.startsWith('/auth/signup')

  const request = (accessToken) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {})
      }
    })

  let accessToken = token
  let res = await request(accessToken)

  if (res.status === 401 && !skipRefresh) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      accessToken = nextToken
      res = await request(accessToken)
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(errorMessage(error))
  }

  return res.json()
}
