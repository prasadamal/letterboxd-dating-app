import { Redirect } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, typography, radii } from '../../lib/theme'

export default function OnboardingWelcome() {
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>REELMATES</Text>
      <Text style={styles.title}>Cinematic dating, matched by taste.</Text>
      <Text style={styles.body}>Rate films daily. When we launch, meet people who loved and hated the same stories you did.</Text>
      <Pressable style={styles.cta} onPress={() => router.push('/onboarding/setup')}>
        <Text style={styles.ctaText}>Set up my taste profile</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center', gap: 14 },
  kicker: { color: colors.accent, ...typography.caption },
  title: { color: colors.text, ...typography.hero },
  body: { color: colors.muted, lineHeight: 22 },
  cta: { marginTop: 12, backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#111', fontWeight: '800' }
})
