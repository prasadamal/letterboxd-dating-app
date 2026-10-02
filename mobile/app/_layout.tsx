import { Stack } from 'expo-router'
import { AuthProvider } from '../lib/auth'
import { colors } from '../lib/theme'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
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
    </AuthProvider>
  )
}
