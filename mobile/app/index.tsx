import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../lib/auth'
import { colors } from '../lib/theme'

export default function Index() {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (!user) return <Redirect href="/login" />

  const completion = user.profile_completion ?? 0
  if (completion < 80) return <Redirect href="/onboarding/welcome" />

  return <Redirect href="/(tabs)/home" />
}
