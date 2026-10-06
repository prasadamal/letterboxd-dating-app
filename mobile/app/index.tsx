import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Button } from '../components/ui'
import { useAuth } from '../lib/auth'
import { colors, type } from '../lib/theme'

export default function Index() {
  const { user, ready, offline, retryRestore } = useAuth()

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.lime} size="large" />
      </View>
    )
  }

  if (!user && offline) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📡</Text>
        <Text style={type.h2}>Can't reach ReelMates</Text>
        <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>Check your connection. You're still signed in.</Text>
        <Button title="Try again" onPress={retryRestore} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </View>
    )
  }

  if (!user) return <Redirect href="/welcome" />
  return <Redirect href="/(tabs)/home" />
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emoji: { fontSize: 44 }
})
