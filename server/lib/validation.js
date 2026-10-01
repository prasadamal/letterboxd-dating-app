const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_AGE = 18
export const MAX_AGE = 120
export const MIN_PASSWORD_LENGTH = 6
export const MAX_PASSWORD_LENGTH = 128

function isString(value) {
  return typeof value === 'string'
}

export function normalizeEmail(email) {
  return isString(email) ? email.trim().toLowerCase() : ''
}

function parseHobbies(value) {
  const list = Array.isArray(value) ? value : isString(value) ? value.split(',') : null
  if (!list) return { error: 'Hobbies must be a list' }
  const cleaned = list.map((item) => (isString(item) ? item.trim() : '')).filter(Boolean)
  if (cleaned.length > 10 || cleaned.some((item) => item.length > 40)) {
    return { error: 'Hobbies: at most 10 items of up to 40 characters' }
  }
  return { value: cleaned }
}

function parseAge(value) {
  const age = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return { error: `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}` }
  }
  return { value: age }
}

/** Returns { value } or { error } for POST /auth/signup bodies. */
export function validateSignup(body = {}) {
  const email = normalizeEmail(body.email)
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { error: 'A valid email is required' }

  if (!isString(body.password) || body.password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }
  }
  if (body.password.length > MAX_PASSWORD_LENGTH) return { error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters` }

  const name = isString(body.name) ? body.name.trim() : ''
  if (!name || name.length > 60) return { error: 'Name is required (max 60 characters)' }

  const age = parseAge(body.age)
  if (age.error) return age

  const city = body.city === undefined ? 'Unknown city' : isString(body.city) ? body.city.trim() : null
  if (city === null || city.length > 80) return { error: 'City must be text up to 80 characters' }

  const bio = body.bio === undefined ? 'I love movies and good conversation.' : isString(body.bio) ? body.bio.trim() : null
  if (bio === null || bio.length > 500) return { error: 'Bio must be text up to 500 characters' }

  let hobbies = ['Cinema', 'Coffee', 'Travel']
  if (body.hobbies !== undefined) {
    const parsed = parseHobbies(body.hobbies)
    if (parsed.error) return parsed
    hobbies = parsed.value
  }

  return { value: { email, password: body.password, name, age: age.value, city, bio, hobbies } }
}

/** Partial update: only keys present in the body are changed, and empty strings clear text fields. */
export function validateProfileUpdate(body = {}) {
  const updates = {}

  if (body.name !== undefined) {
    const name = isString(body.name) ? body.name.trim() : ''
    if (!name || name.length > 60) return { error: 'Name cannot be empty (max 60 characters)' }
    updates.name = name
  }
  if (body.city !== undefined) {
    if (!isString(body.city) || body.city.trim().length > 80) return { error: 'City must be text up to 80 characters' }
    updates.city = body.city.trim()
  }
  if (body.bio !== undefined) {
    if (!isString(body.bio) || body.bio.trim().length > 500) return { error: 'Bio must be text up to 500 characters' }
    updates.bio = body.bio.trim()
  }
  if (body.age !== undefined) {
    const age = parseAge(body.age)
    if (age.error) return age
    updates.age = age.value
  }
  if (body.hobbies !== undefined) {
    const hobbies = parseHobbies(body.hobbies)
    if (hobbies.error) return hobbies
    updates.hobbies = hobbies.value
  }
  return { value: updates }
}

export function parseId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}
