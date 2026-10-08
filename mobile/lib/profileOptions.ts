import Constants from 'expo-constants'
import type { Gender } from './types'

export const GENDER_OPTIONS: { value: Gender; label: string; plural: string }[] = [
  { value: 'female', label: 'Woman', plural: 'Women' },
  { value: 'male', label: 'Man', plural: 'Men' },
  { value: 'nonbinary', label: 'Non-binary', plural: 'Non-binary people' }
]

export function genderLabel(gender?: string | null) {
  if (gender === 'other') return 'Non-binary'
  return GENDER_OPTIONS.find((g) => g.value === gender)?.label || ''
}

// Mirrors server/lib/datingEligibility.js defaultInterestedIn.
export function defaultInterestedIn(gender: Gender): Gender[] {
  if (gender === 'male') return ['female']
  if (gender === 'female') return ['male']
  return ['male', 'female', 'nonbinary']
}

export function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

// Same keys as server/lib/profilePrompts.js.
export const PROFILE_PROMPTS: Record<string, string> = {
  defend_forever: 'A film I will defend forever',
  overrated: 'Overrated, fight me',
  first_date: 'My perfect first-date film',
  cried: 'The last film that made me cry',
  comfort: 'My comfort rewatch',
  character: 'The character I relate to most',
  quote: 'A line I quote way too often',
  cinema: 'Best cinema experience of my life',
  guilty: 'Guilty pleasure, no shame',
  sequel: 'A film that deserves a sequel'
}

export const MAX_PROMPTS = 3

// One-tap city choices, launch cities first (server/lib/cityLaunch.js resolves other spellings like Cochin).
export const SUGGESTED_CITIES: Record<string, string[]> = {
  india: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Bengaluru', 'Chennai', 'Hyderabad', 'Mumbai', 'Delhi', 'Kolkata', 'Pune']
}

export function suggestedCities(country?: string | null) {
  return SUGGESTED_CITIES[String(country || '').trim().toLowerCase()] || []
}

// Public web app that serves /taste/<code> (the API's Docker image serves it too).
export const WEB_URL = String(process.env.EXPO_PUBLIC_WEB_URL || Constants.expoConfig?.extra?.webUrl || 'https://reelmates.app').replace(/\/$/, '')

// Legal pages live on the website (web app /privacy, /terms, /support, /delete-account).
export const PRIVACY_URL = `${WEB_URL}/privacy`
export const TERMS_URL = `${WEB_URL}/terms`
