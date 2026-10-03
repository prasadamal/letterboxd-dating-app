import { Redirect } from 'expo-router'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useAuth } from '../lib/auth'
import { colors } from '../lib/theme'

export default function Index() {
  const { user, ready, offline, retryRestore } = useAuth()

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (!user && offline) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Can't reach ReelMates</Text>
        <Text style={{ color: colors.muted, textAlign: 'center' }}>Check your connection. You're still signed in.</Text>
        <Pressable
          onPress={retryRestore}
          style={{ backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  if (!user) return <Redirect href="/login" />

  return <Redirect href="/(tabs)/home" />
}
