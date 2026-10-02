import Constants from 'expo-constants'
import type { User } from './types'

const fallbackDev =
  Constants.expoConfig?.hostUri?.split(':').shift() === 'localhost'
    ? 'http://localhost:4000/api'
    : `http://${Constants.expoConfig?.hostUri?.split(':').shift() || '10.0.2.2'}:4000/api`

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || fallbackDev

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })

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
