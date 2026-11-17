import Constants from 'expo-constants'
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './session'

const fallbackDev =
  Constants.expoConfig?.hostUri?.split(':').shift() === 'localhost'
    ? 'http://localhost:4000/api'
    : `http://${Constants.expoConfig?.hostUri?.split(':').shift() || '10.0.2.2'}:4000/api`

// Release builds must be built with EXPO_PUBLIC_API_URL (set per profile in eas.json); the LAN fallback is dev-only.
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? fallbackDev : '')).replace(/\/$/, '')
export const API_CONFIGURED = Boolean(API_BASE) && !API_BASE.includes('YOUR_PRODUCTION_API_HOST')

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function timedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  options.signal?.addEventListener('abort', abort)
  const timeout = setTimeout(abort, 20000)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', abort) }
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return null

    let res: Response
    try {
      res = await timedFetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
    } catch {
      throw new ApiError('No connection. Try again when you are online.', 0, 'NETWORK')
    }

    if (!res.ok) {
      // Only a rejected refresh token ends the session; a server hiccup should not sign the user out.
      if (res.status === 400 || res.status === 401) { await clearTokens(); return null }
      throw new ApiError('The server is temporarily unavailable. Please try again.', res.status, 'REFRESH_UNAVAILABLE')
    }

    const data = (await res.json()) as { token: string; refreshToken?: string }
    await saveTokens(data.token, data.refreshToken)
    return data.token
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const skipRefresh =
    path.startsWith('/auth/refresh') || path.startsWith('/auth/login') || path.startsWith('/auth/signup')

  const request = async (accessToken: string | null | undefined) => {
    // A 401 retry rotates refresh credentials. Logout must revoke that new token,
    // rather than submitting the now-revoked token captured before the retry.
    const body = path === '/auth/logout' && typeof options.body === 'string'
      ? JSON.stringify({ ...JSON.parse(options.body), refreshToken: await getRefreshToken() })
      : options.body
    return timedFetch(`${API_BASE}${path}`, {
      ...options,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {})
      }
    })
  }

  if (!API_CONFIGURED) throw new ApiError('This build has no server configured. Please update the app.', 0, 'NO_API')

  // Prefer the stored token: it is the freshest after a background refresh, while callers may hold an old one.
  let accessToken = (await getAccessToken()) ?? token
  let res: Response
  try {
    res = await request(accessToken)
  } catch {
    throw new ApiError('No connection. Check your internet and try again.', 0, 'NETWORK')
  }

  if (res.status === 401 && !skipRefresh) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      accessToken = nextToken
      try { res = await request(accessToken) }
      catch { throw new ApiError('No connection. Check your internet and try again.', 0, 'NETWORK') }
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(error.message || 'Request failed', res.status, error.code)
  }

  return res.json()
}
