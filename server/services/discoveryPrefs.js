const DEFAULT_MIN_AGE = 18
const DEFAULT_MAX_AGE = 100

export function normalizeDiscoveryPrefs(raw = {}) {
  const minAge = Number.isFinite(raw.minAge) ? raw.minAge : DEFAULT_MIN_AGE
  const maxAge = Number.isFinite(raw.maxAge) ? raw.maxAge : DEFAULT_MAX_AGE
  const countries = Array.isArray(raw.countries)
    ? raw.countries.map((c) => String(c).trim()).filter(Boolean)
    : []
  return {
    minAge: Math.min(minAge, maxAge),
    maxAge: Math.max(minAge, maxAge),
    countries
  }
}

export function passesDiscoveryFilters(candidate, prefs = {}) {
  const normalized = normalizeDiscoveryPrefs(prefs)
  const age = Number(candidate?.age ?? 25)
  if (age < normalized.minAge || age > normalized.maxAge) return false

  if (normalized.countries.length) {
    const country = String(candidate?.country || '').trim().toLowerCase()
    const allowed = normalized.countries.some((c) => c.toLowerCase() === country)
    if (!allowed) return false
  }

  return true
}
