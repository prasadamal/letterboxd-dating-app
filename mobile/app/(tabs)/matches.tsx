import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { colors } from '../../lib/theme'
import type { Match } from '../../lib/types'

export default function MatchesScreen() {
  const { token, user } = useAuth()
  const { platform } = usePlatform()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    if (!token || !platform?.datingLaunched) return
    apiFetch<{ matches: Match[] }>('/dating/matches', {}, token)
      .then((data) => setMatches(data.matches || []))
      .catch(console.error)
  }, [token, platform?.datingLaunched])

  if (!platform?.datingLaunched) {
    return (
      <View style={styles.screen}>
        <Text style={styles.locked}>Matches appear after the 500/500 launch.</Text>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>MUTUAL MATCHES</Text>
            <Text style={styles.heading}>You both liked each other</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>Like profiles in Dating to create matches.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.name}, {item.age}
            </Text>
            <Text style={styles.sub}>{item.country || item.city} · {Math.round(item.score)}% match</Text>
            {!!item.likedLine && <Text style={styles.good}>{item.likedLine}</Text>}
            {!!item.dislikedLine && <Text style={styles.bad}>{item.dislikedLine}</Text>}
            {item.introPending && <Text style={styles.intro}>Send one hello each to unlock full chat.</Text>}
            <Pressable style={styles.primaryBtn} onPress={() => router.push(`/chat/${item.id}`)}>
              <Text style={styles.primaryText}>Message</Text>
            </Pressable>
            <Pressable
              style={styles.ghostBtn}
              onPress={async () => {
                await apiFetch('/safety/block', { method: 'POST', body: JSON.stringify({ userId: item.id }) }, token)
              }}
            >
              <Text style={styles.ghostText}>Block</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  locked: { color: colors.muted, padding: 16, lineHeight: 20 },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1, marginBottom: 6 },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  empty: { color: colors.muted, paddingTop: 20 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 6 },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted },
  good: { color: colors.green },
  bad: { color: colors.error },
  intro: { color: colors.peach, fontSize: 12 },
  primaryBtn: { alignSelf: 'flex-end', backgroundColor: colors.pink, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 6 },
  primaryText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { alignSelf: 'flex-end', paddingVertical: 6 },
  ghostText: { color: colors.muted, fontSize: 12 }
})
