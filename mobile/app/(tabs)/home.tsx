import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { colors } from '../../lib/theme'

function CounterCard({ label, count, target }: { label: string; count: number; target: number }) {
  const pct = Math.min(100, Math.round((count / target) * 100))
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardCount}>
        {count} <Text style={styles.cardTarget}>/ {target}</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  )
}

export default function HomeScreen() {
  const { platform } = usePlatform()
  const { user } = useAuth()
  const router = useRouter()
  const needsPhoto = user && !user.matchmaking_enabled && !user.photo_url

  if (!platform) {
    return (
      <View style={styles.screen}>
        <Text style={styles.muted}>Loading community progress…</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>REELMATES LAUNCH</Text>
      <Text style={styles.heading}>Movie taste first. Dating when we're balanced.</Text>
      <Text style={styles.body}>
        Register, play the daily 10-film game, and help us reach {platform.maleTarget} men and {platform.femaleTarget} women.
        Then the dating deck opens with taste-based matches and chat.
      </Text>

      <CounterCard label="Men registered" count={platform.maleCount} target={platform.maleTarget} />
      <CounterCard label="Women registered" count={platform.femaleCount} target={platform.femaleTarget} />

      {needsPhoto && (
        <Pressable style={styles.photoCard} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.statusTitle}>Add a photo to unlock dating</Text>
          <Text style={styles.statusBody}>
            You can play the daily game now. Matchmaking opens once your profile is at least 80% complete (a photo is the missing piece).
          </Text>
        </Pressable>
      )}

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>{platform.datingLaunched ? 'Dating is LIVE' : 'Dating locked'}</Text>
        <Text style={styles.statusBody}>
          {platform.datingLaunched
            ? 'Head to the Dating tab to like profiles and match on shared films.'
            : `Overall launch progress: ${platform.progressPercent}%`}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1 },
  heading: { color: colors.text, fontSize: 24, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 22 },
  muted: { color: colors.muted, padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardLabel: { color: colors.muted, marginBottom: 4 },
  cardCount: { color: colors.text, fontSize: 28, fontWeight: '800' },
  cardTarget: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  track: { marginTop: 10, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  fill: { height: 8, borderRadius: 999, backgroundColor: colors.pink },
  photoCard: { backgroundColor: 'rgba(255,105,147,0.12)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  statusCard: { backgroundColor: 'rgba(173,124,255,0.12)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  statusTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  statusBody: { color: colors.soft, marginTop: 6, lineHeight: 20 }
})
