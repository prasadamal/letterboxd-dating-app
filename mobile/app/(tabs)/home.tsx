import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
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
      <View style={[styles.scroll, styles.screen]}>
        <Text style={styles.muted}>Loading community progress…</Text>
      </View>
    )
  }

  const country = platform.country
  const streak = user?.streak

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <Text style={styles.eyebrow}>REELMATES LAUNCH</Text>
      <Text style={styles.heading}>Movie taste first. Dating when we're balanced.</Text>
      <Text style={styles.body}>
        Play the daily 10-film game and bring your friends. Dating opens in a country as soon as it has{' '}
        {platform.countryTarget ?? 150} men and {platform.countryTarget ?? 150} women, and everywhere at{' '}
        {platform.maleTarget} + {platform.femaleTarget}.
      </Text>

      {streak && (
        <Pressable style={styles.streakCard} onPress={() => router.push('/(tabs)/taste')}>
          <Text style={styles.streakFlame}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {streak.current ? `${streak.current}-day streak` : 'Start a streak today'}
            </Text>
            <Text style={styles.featureBody}>
              {streak.playedToday
                ? `Played today. Best: ${streak.best} days.`
                : streak.current
                  ? "Play today's films to keep it going."
                  : 'Rate at least one film a day to build it.'}
            </Text>
          </View>
        </Pressable>
      )}

      <View style={styles.featureRow}>
        <Pressable style={styles.feature} onPress={() => router.push('/friends')}>
          <Text style={styles.featureTitle}>Film friends</Text>
          <Text style={styles.featureBody}>Compare taste with anyone and find films to watch together.</Text>
        </Pressable>
        <Pressable style={styles.feature} onPress={() => router.push('/(tabs)/taste')}>
          <Text style={styles.featureTitle}>People's chart</Text>
          <Text style={styles.featureBody}>The best films, ranked by everyone's likes. Films → Explore.</Text>
        </Pressable>
      </View>

      {country && !platform.globalLaunched && (
        <>
          <Text style={styles.section}>
            {country.name.toUpperCase()} {country.open ? '· DATING OPEN' : `· ${country.progressPercent}%`}
          </Text>
          <CounterCard label={`Men in ${country.name}`} count={country.maleCount} target={country.target} />
          <CounterCard label={`Women in ${country.name}`} count={country.femaleCount} target={country.target} />
        </>
      )}

      {!platform.globalLaunched && <Text style={styles.section}>EVERYWHERE</Text>}
      <CounterCard label="Men registered" count={platform.maleCount} target={platform.maleTarget} />
      <CounterCard label="Women registered" count={platform.femaleCount} target={platform.femaleTarget} />
      {platform.otherCount > 0 && <Text style={styles.muted}>Plus {platform.otherCount} non-binary members.</Text>}

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
          {platform.regionOnly
            ? `Dating is open in ${country?.name}. You'll meet people from ${country?.name} until the global launch.`
            : platform.datingLaunched
              ? 'Head to the Dating tab to like profiles and match on shared films.'
              : 'Invite friends from Profile to open dating sooner. Every referral counts towards your country.'}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  feature: { flex: 1, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 },
  featureTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  featureBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  scroll: { flex: 1, backgroundColor: colors.bg },
  screen: { padding: 16, gap: 12 },
  section: { color: colors.peach, fontSize: 11, letterSpacing: 1.1, marginTop: 4 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,170,90,0.10)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  streakFlame: { fontSize: 30 },
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
