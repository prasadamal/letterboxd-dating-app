import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { secureStorage } from './session'
import { Platform } from 'react-native'
import { apiFetch } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

const PUSH_TOKEN_KEY = 'reelmates_push_token'

export async function getRegisteredPushToken() {
  return secureStorage.getItem(PUSH_TOKEN_KEY)
}

export async function clearRegisteredPushToken() {
  await secureStorage.removeItem(PUSH_TOKEN_KEY)
}

export async function registerDevicePushToken(accessToken: string) {
  if (Platform.OS === 'web') return

  // Push tokens are scoped to the EAS project; without one (before `eas init`) there is nothing to register.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Matches and messages',
      importance: Notifications.AndroidImportance.HIGH
    })
  }

  const permissions = await Notifications.getPermissionsAsync()
  const status =
    permissions.status === 'granted' ? permissions.status : (await Notifications.requestPermissionsAsync()).status

  if (status !== 'granted') return

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })

  const platform = Platform.OS === 'ios' ? 'ios' : 'android'
  await apiFetch('/notifications/register', {
    method: 'POST',
    body: JSON.stringify({ token: tokenData.data, platform })
  }, accessToken)
  await secureStorage.setItem(PUSH_TOKEN_KEY, tokenData.data)
}
