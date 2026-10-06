// Regional launch: dating can open country by country instead of waiting for the global 500/500.
// A country opens when it reaches `countryTarget` men AND women, or when an admin opens it by hand.

export function normalizeCountry(country) {
  return String(country || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function sameCountry(a, b) {
  const left = normalizeCountry(a)
  return Boolean(left) && left === normalizeCountry(b)
}

export function isOpenedByAdmin(country, openCountries = []) {
  const key = normalizeCountry(country)
  return Boolean(key) && openCountries.some((c) => normalizeCountry(c) === key)
}

export function countryProgress({ country, maleCount = 0, femaleCount = 0, countryTarget, openCountries = [] }) {
  const target = Math.max(1, Number(countryTarget) || 1)
  const reached = maleCount >= target && femaleCount >= target
  const manual = isOpenedByAdmin(country, openCountries)
  return {
    name: String(country || '').trim(),
    maleCount,
    femaleCount,
    target,
    open: Boolean(normalizeCountry(country)) && (reached || manual),
    openedByAdmin: manual,
    progressPercent: Math.min(
      100,
      Math.round(((Math.min(maleCount, target) + Math.min(femaleCount, target)) / (2 * target)) * 100)
    )
  }
}

// Escapes % and _ so a country name can be matched exactly (case-insensitively) with ILIKE.
export function ilikeExact(value) {
  return String(value || '').trim().replace(/[\\%_]/g, (ch) => `\\${ch}`)
}
