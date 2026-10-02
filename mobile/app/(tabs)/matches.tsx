import { useEffect, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch, buildTasteSummary } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'
import type { Match } from '../../lib/types'

export default function MatchesScreen() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    if (!token) return
    apiFetch<{ matches: Match[] }>('/matches', {}, token)
      .then((data) => setMatches(data.matches || []))
      .catch(console.error)
  }, [token])

  return (
    <View style={styles.screen}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <>
            <Text style={styles.eyebrow}>MATCHED BY TASTE</Text>
            <Text style={styles.heading}>People with similar movie instincts</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}, {item.age}</Text>
                <Text style={styles.sub}>{item.city} · {Math.round(item.score)}% match</Text>
              </View>
            </View>
            <Text style={styles.bio}>{item.bio}</Text>
            <Text style={styles.taste}>{buildTasteSummary(user, item)}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push(`/chat/${item.id}`)}>
              <Text style={styles.primaryText}>Message</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1, marginBottom: 6 },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  avatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.border },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted, marginTop: 2 },
  bio: { color: colors.muted, lineHeight: 20, marginBottom: 8 },
  taste: { color: colors.soft, marginBottom: 12 },
  primaryBtn: { alignSelf: 'flex-end', backgroundColor: colors.pink, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  primaryText: { color: '#fff', fontWeight: '700' }
})
