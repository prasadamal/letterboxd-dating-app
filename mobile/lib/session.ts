import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'reelmates_token'
const REFRESH_KEY = 'reelmates_refresh_token'
const SESSION_KEY = 'reelmates_session_v2'

async function readSession(): Promise<{ accessToken: string; refreshToken: string | null } | null> {
  const raw = await secureStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

// SecureStore (Keychain / Keystore) on iOS and Android; it has no web implementation, so the web
// preview (`npx expo start --web`) falls back to localStorage.
export const secureStorage = {
  getItem: (key: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.setItem(key, value)) : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(key)) : SecureStore.deleteItemAsync(key)
}

export async function getAccessToken() {
  return (await readSession())?.accessToken ?? secureStorage.getItem(TOKEN_KEY)
}

export async function getRefreshToken() {
  return (await readSession())?.refreshToken ?? secureStorage.getItem(REFRESH_KEY)
}

export async function saveTokens(accessToken: string, refreshToken?: string | null) {
  await secureStorage.setItem(SESSION_KEY, JSON.stringify({ accessToken, refreshToken: refreshToken ?? null }))
  await secureStorage.removeItem(TOKEN_KEY)
  await secureStorage.removeItem(REFRESH_KEY)
}

export async function clearTokens() {
  await secureStorage.removeItem(SESSION_KEY)
  await secureStorage.removeItem(TOKEN_KEY)
  await secureStorage.removeItem(REFRESH_KEY)
}
