// Dating opens city by city. A city opens when it has `cityTarget` women AND men who want to date, or when an
// admin opens it by hand. An admin can also open dating everywhere (app-store reviewers, testing).
// Decks stay inside the member's city unless both people chose "all open cities in my country".

// Common alternative names, so "Cochin" and "Kochi" count as one city. Keys are lower case.
const CITY_ALIASES = {
  cochin: 'Kochi',
  ernakulam: 'Kochi',
  trivandrum: 'Thiruvananthapuram',
  tvm: 'Thiruvananthapuram',
  calicut: 'Kozhikode',
  trichur: 'Thrissur',
  alleppey: 'Alappuzha',
  quilon: 'Kollam',
  palghat: 'Palakkad',
  cannanore: 'Kannur',
  bangalore: 'Bengaluru',
  blr: 'Bengaluru',
  mysore: 'Mysuru',
  mangalore: 'Mangaluru',
  madras: 'Chennai',
  bombay: 'Mumbai',
  'navi mumbai': 'Mumbai',
  calcutta: 'Kolkata',
  'new delhi': 'Delhi',
  'delhi ncr': 'Delhi',
  ncr: 'Delhi',
  gurgaon: 'Gurugram',
  poona: 'Pune',
  baroda: 'Vadodara',
  vizag: 'Visakhapatnam',
  benares: 'Varanasi',
  banaras: 'Varanasi',
  pondicherry: 'Puducherry',
  pondy: 'Puducherry',
  trichy: 'Tiruchirappalli',
  hyd: 'Hyderabad',
  secunderabad: 'Hyderabad'
}

// Launch cities first: these are offered as one-tap choices in the app.
export const SUGGESTED_CITIES = {
  india: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Bengaluru', 'Chennai', 'Hyderabad', 'Mumbai', 'Delhi', 'Kolkata', 'Pune']
}

function collapse(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export function normalizeCountry(country) {
  return collapse(country).toLowerCase()
}

// "kochi, kerala" → "Kochi"; aliases resolve to one spelling; all-lower-case input gets title case.
export function canonicalCity(value) {
  const first = collapse(String(value || '').split(',')[0])
  if (!first) return ''
  const alias = CITY_ALIASES[first.toLowerCase()]
  if (alias) return alias
  return first === first.toLowerCase() ? first.replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase()) : first
}

export function cityKey(city, country) {
  const c = canonicalCity(city).toLowerCase()
  const k = normalizeCountry(country)
  return c && k ? `${c}|${k}` : ''
}

export function sameCity(a, b) {
  const key = cityKey(a?.city, a?.country)
  return Boolean(key) && key === cityKey(b?.city, b?.country)
}

export function sameCountry(a, b) {
  const key = normalizeCountry(a?.country)
  return Boolean(key) && key === normalizeCountry(b?.country)
}

// Admin entries are "City" (any country) or "City, Country".
export function isOpenedByAdmin(city, country, openCities = []) {
  const name = canonicalCity(city).toLowerCase()
  if (!name) return false
  return openCities.some((entry) => {
    const [entryCity, ...rest] = String(entry).split(',')
    if (canonicalCity(entryCity).toLowerCase() !== name) return false
    const entryCountry = normalizeCountry(rest.join(','))
    return !entryCountry || entryCountry === normalizeCountry(country)
  })
}

export function cityProgress({ city, country, femaleCount = 0, maleCount = 0, cityTarget, openCities = [] }) {
  const target = Math.max(1, Number(cityTarget) || 1)
  const name = canonicalCity(city)
  const manual = isOpenedByAdmin(name, country, openCities)
  const reached = femaleCount >= target && maleCount >= target
  return {
    key: cityKey(name, country),
    name,
    country: collapse(country),
    femaleCount,
    maleCount,
    target,
    open: Boolean(name) && (reached || manual),
    openedByAdmin: manual,
    progressPercent: Math.min(
      100,
      Math.round(((Math.min(femaleCount, target) + Math.min(maleCount, target)) / (2 * target)) * 100)
    )
  }
}

// What a member sees about a city: no gender counts.
export function publicCityProgress(progress) {
  if (!progress) return null
  const { name, country, target, open, progressPercent } = progress
  return { name, country, target, open, progressPercent }
}

// Who to show: 'city' (default) = my city only; 'country' = every open city in my country. Both people's choices
// must allow the other. `openCityKeys` holds cities open by numbers, `openCities` the admin's list, and
// `openEverywhere` the admin override.
export function datingArea(prefs) {
  return prefs?.area === 'country' ? 'country' : 'city'
}

export function inDatingArea({ openEverywhere = false, openCityKeys = new Set(), openCities = [] }, self, other) {
  if (sameCity(self, other)) return true
  // When an admin opens dating everywhere, people who haven't set a city still meet within their country.
  if (openEverywhere && (!cityKey(self?.city, self?.country) || !cityKey(other?.city, other?.country))) {
    return sameCountry(self, other)
  }
  if (datingArea(self?.discovery_prefs) !== 'country' || datingArea(other?.discovery_prefs) !== 'country') return false
  if (!sameCountry(self, other)) return false
  return openEverywhere || openCityKeys.has(cityKey(other?.city, other?.country)) || isOpenedByAdmin(other?.city, other?.country, openCities)
}
