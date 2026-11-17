import crypto from 'crypto'

// Friend codes double as referral codes and as the public taste-card address.
// They are random: a code derived from an email or a user id could be worked out
// by anyone who knows that email or id, and adding someone by code makes two
// people friends without the other person confirming.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no I, L, O, 0 or 1: easy to read aloud and type
const CODE_LENGTH = 8
const PREFIX = 'REEL'

export function newFriendCode(randomInt = crypto.randomInt) {
  let code = PREFIX
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[randomInt(ALPHABET.length)]
  return code
}

/** True for a Postgres unique-constraint error; `constraint` narrows it to one index. */
export function isUniqueViolation(error, constraint) {
  if (!error || error.code !== '23505') return false
  if (!constraint) return true
  return `${error.message || ''} ${error.details || ''}`.includes(constraint)
}

/**
 * Runs `attempt(code)` with fresh codes until it stops failing on a code clash.
 * Any other error is rethrown at once.
 */
export async function withFreshFriendCode(attempt, { tries = 5, generate = newFriendCode } = {}) {
  let lastError
  for (let i = 0; i < tries; i += 1) {
    try {
      return await attempt(generate())
    } catch (error) {
      if (!isUniqueViolation(error, 'referral_code')) throw error
      lastError = error
    }
  }
  throw lastError
}
