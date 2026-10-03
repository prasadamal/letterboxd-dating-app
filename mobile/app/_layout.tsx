import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { AuthProvider } from '../lib/auth'
import { PlatformProvider } from '../lib/platform'
import { colors } from '../lib/theme'

export default function RootLayout() {
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
