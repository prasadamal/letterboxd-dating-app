import Constants from 'expo-constants'
import type { User } from './types'
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './session'

const fallbackDev =
  Constants.expoConfig?.hostUri?.split(':').shift() === 'localhost'
    ? 'http://localhost:4000/api'
    : `http://${Constants.expoConfig?.hostUri?.split(':').shift() || '10.0.2.2'}:4000/api`

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || fallbackDev

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return null

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!res.ok) {
      await clearTokens()
      return null
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

  const request = (accessToken: string | null | undefined) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {})
      }
    })

  let accessToken = token ?? (await getAccessToken())
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
    throw new Error(error.message || 'Request failed')
  }

  return res.json()
}

export function movieLabel(movie: { title: string; year: number }) {
  return `${movie.title} (${movie.year})`
}

export function buildTasteSummary(user?: User | null, match?: User | null) {
  if (!user || !match) return 'Still discovering taste overlap.'
  const sharedLoved = (match.loved || []).filter((m) => (user.loved || []).includes(m)).slice(0, 2)
  const sharedHated = (match.hated || []).filter((m) => (user.hated || []).includes(m)).slice(0, 2)
  const parts: string[] = []
  if (sharedLoved.length) parts.push(`Liked: ${sharedLoved.join(' · ')}`)
  if (sharedHated.length) parts.push(`Disliked: ${sharedHated.join(' · ')}`)
  return parts.join(' · ') || 'Different taste, worth a conversation.'
}
