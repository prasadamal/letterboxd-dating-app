// Who can see whom in the dating deck. Interest has to go both ways: I want to see your gender AND you want
// to see mine. Gender 'other' (legacy) is treated like 'nonbinary'.

export const GENDERS = ['male', 'female', 'nonbinary']

export function canonicalGender(gender) {
  if (gender === 'other') return 'nonbinary'
  return GENDERS.includes(gender) ? gender : null
}

// Used when someone signs up without choosing: men see women, women see men, non-binary people see everyone.
export function defaultInterestedIn(gender) {
  const canonical = canonicalGender(gender)
  if (canonical === 'male') return ['female']
  if (canonical === 'female') return ['male']
  return [...GENDERS]
}

export function normalizeInterestedIn(value, gender) {
  const list = Array.isArray(value) ? [...new Set(value.map(canonicalGender).filter(Boolean))] : []
  return list.length ? GENDERS.filter((g) => list.includes(g)) : defaultInterestedIn(gender)
}

export function wants(person, otherGender) {
  const canonical = canonicalGender(otherGender)
  if (!canonical) return false
  return normalizeInterestedIn(person?.interested_in, person?.gender).includes(canonical)
}

export function isMutualInterest(self, candidate) {
  return wants(self, candidate?.gender) && wants(candidate, self?.gender)
}

// Values for `.in('gender', …)` when loading the deck (includes the legacy 'other').
export function genderQueryValues(self) {
  const list = normalizeInterestedIn(self?.interested_in, self?.gender)
  return list.includes('nonbinary') ? [...list, 'other'] : list
}
