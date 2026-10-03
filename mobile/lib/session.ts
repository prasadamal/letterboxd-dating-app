import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'reelmates_token'
const REFRESH_KEY = 'reelmates_refresh_token'

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY)
}

export async function saveTokens(accessToken: string, refreshToken?: string | null) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken)
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}
