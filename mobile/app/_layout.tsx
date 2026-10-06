import { Ionicons } from '@expo/vector-icons'
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold
} from '@expo-google-fonts/bricolage-grotesque'
import { useFonts } from 'expo-font'
import * as Notifications from 'expo-notifications'
import { Stack, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '../lib/auth'
import { PlatformProvider } from '../lib/platform'
import { colors, fonts } from '../lib/theme'

// Shows expo-router's recovery screen instead of a white crash if any screen throws while rendering.
export { ErrorBoundary } from 'expo-router'

SplashScreen.preventAutoHideAsync().catch(() => null)

// Tapping a push notification opens the right place (the server sends { event, fromUserId | peerId }).
function useNotificationRouting(ready: boolean) {
  const router = useRouter()
  useEffect(() => {
    // Wait until the navigator is mounted: navigating earlier throws on a cold start from a notification.
    if (!ready || Platform.OS === 'web') return
    const open = (data: Record<string, unknown> | undefined) => {
      if (!data) return
      if (data.event === 'new_message' && typeof data.fromUserId === 'string') {
        router.push({ pathname: '/chat/[userId]', params: { userId: data.fromUserId } })
      } else if (data.event === 'new_match') {
        router.push('/(tabs)/messages')
      } else if (data.event === 'daily_game') {
        router.push('/(tabs)/home')
      }
    }
    Notifications.getLastNotificationResponseAsync()
      .then((response) => open(response?.notification.request.content.data))
      .catch(() => null)
    const sub = Notifications.addNotificationResponseReceivedListener((response) => open(response.notification.request.content.data))
    return () => sub.remove()
  }, [router, ready])
}

const pushedHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
  headerBackButtonDisplayMode: 'minimal' as const
}

export default function RootLayout() {
  const [loaded, failed] = useFonts({
    ...Ionicons.font,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold
  })
  useNotificationRouting(loaded || Boolean(failed))

  useEffect(() => {
    if (loaded || failed) SplashScreen.hideAsync().catch(() => null)
  }, [loaded, failed])

  // Fonts are bundled, so this is a frame or two; a missing font falls back to the system font.
  if (!loaded && !failed) return null

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <AuthProvider>
        <PlatformProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="friends" options={{ ...pushedHeader, title: 'Film friends' }} />
            <Stack.Screen name="compare/[userId]" options={{ ...pushedHeader, title: '' }} />
            <Stack.Screen name="settings" options={{ ...pushedHeader, title: 'Settings' }} />
            <Stack.Screen name="edit-profile" options={{ ...pushedHeader, title: 'Edit profile' }} />
            <Stack.Screen name="chat/[userId]" options={{ ...pushedHeader, title: '' }} />
          </Stack>
        </PlatformProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
