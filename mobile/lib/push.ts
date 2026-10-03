import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
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

export async function registerDevicePushToken(accessToken: string) {
  if (Platform.OS === 'web') return

  const permissions = await Notifications.getPermissionsAsync()
  const status =
    permissions.status === 'granted' ? permissions.status : (await Notifications.requestPermissionsAsync()).status

  if (status !== 'granted') return

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const tokenData = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync()

  const platform = Platform.OS === 'ios' ? 'ios' : 'android'
  await apiFetch('/notifications/register', {
    method: 'POST',
    body: JSON.stringify({ token: tokenData.data, platform })
  }, accessToken)
}
