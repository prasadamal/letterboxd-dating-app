import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const KEY_LENGTH = 64

// Stored format: scrypt$<salt hex>$<hash hex>
export function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = await scrypt(String(password), salt, KEY_LENGTH)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false
  const [scheme, saltHex, hashHex] = stored.split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scrypt(String(password), Buffer.from(saltHex, 'hex'), expected.length)
  return crypto.timingSafeEqual(actual, expected)
}

// Used to burn comparable CPU time when the email is unknown (avoids user enumeration by timing).
const DUMMY_HASH = hashPasswordSync('reelmates-dummy-password')
export async function verifyDummyPassword(password) {
  await verifyPassword(password, DUMMY_HASH)
  return false
}

/** Strip every field that must never leave the server. */
export function publicUser(user) {
  if (!user) return user
  const { password, password_hash, ...safe } = user
  return {
    ...safe,
    loved: safe.loved || [],
    hated: safe.hated || [],
    hobbies: safe.hobbies || []
  }
}
