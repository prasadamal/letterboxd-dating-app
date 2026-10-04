import { Ionicons } from '@expo/vector-icons'
import { useFonts } from 'expo-font'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { AuthProvider } from '../lib/auth'
import { PlatformProvider } from '../lib/platform'
import { colors } from '../lib/theme'

// Shows expo-router's recovery screen instead of a white crash if any screen throws while rendering.
export { ErrorBoundary } from 'expo-router'

export default function RootLayout() {
  // Preload the tab-bar icon font so icons never render as empty boxes or pop in late.
  useFonts(Ionicons.font)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PlatformProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="friends"
              options={{ headerShown: true, headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, title: 'Film friends' }}
            />
            <Stack.Screen
              name="compare/[userId]"
              options={{ headerShown: true, headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, title: 'Compare' }}
            />
            <Stack.Screen
              name="chat/[userId]"
              options={{
                presentation: 'modal',
                headerShown: true,
                headerStyle: { backgroundColor: colors.card },
                headerTintColor: colors.text,
                title: 'Chat'
              }}
            />
          </Stack>
        </PlatformProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
