const API_BASE = '/api'

export function getToken() {
  return localStorage.getItem('reelmates_token')
}

export function setToken(token) {
  localStorage.setItem('reelmates_token', token)
}

export function clearToken() {
  localStorage.removeItem('reelmates_token')
}

export async function apiFetch(path, options = {}, token = getToken()) {
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

export function buildTasteSummary(user, match) {
  if (!user || !match) return 'Taste vibe is still being discovered.'

  const sharedLoved = (match.loved || []).filter((movie) => (user.loved || []).includes(movie)).slice(0, 2)
  const sharedHated = (match.hated || []).filter((movie) => (user.hated || []).includes(movie)).slice(0, 2)
  const parts = []

  if (sharedLoved.length) parts.push(`Loved: ${sharedLoved.join(' and ')} like you`)
  if (sharedHated.length) parts.push(`Hated: ${sharedHated.join(' and ')} like you`)

  return parts.join(' · ') || 'Different taste, but definitely interesting.'
}

export function movieLabel(movie) {
  return `${movie.title} (${movie.year})`
}
