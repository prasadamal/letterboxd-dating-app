import { useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { TasteProfileCard } from '../../components/TasteProfileCard'
import { EmptyState } from '../../components/EmptyState'
import { colors } from '../../lib/theme'
import type { LikesYou, Match } from '../../lib/types'

export default function MatchesScreen() {
  const { token } = useAuth()
  const { platform } = usePlatform()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [likes, setLikes] = useState<LikesYou | null>(null)

  useEffect(() => {
    if (!token || !platform?.datingLaunched) return
    apiFetch<{ matches: Match[] }>('/dating/matches', {}, token)
      .then((data) => setMatches(data.matches || []))
      .catch(() => null)
    apiFetch<LikesYou>('/dating/likes-you', {}, token)
      .then(setLikes)
      .catch(() => null)
  }, [token, platform?.datingLaunched])

  async function likeBack(profile: Match) {
    try {
      const result = await apiFetch<{ matched: boolean }>(
        '/dating/swipe',
        { method: 'POST', body: JSON.stringify({ targetId: profile.id, action: 'like' }) },
        token
      )
      setLikes((current) => current && { ...current, count: current.count - 1, profiles: current.profiles.filter((p) => p.id !== profile.id) })
      if (result.matched) setMatches((current) => [{ ...profile, introPending: true, chatUnlocked: false }, ...current])
    } catch (err) {
      Alert.alert('Could not like back', err instanceof Error ? err.message : 'Try again')
    }
  }

  if (!platform?.datingLaunched) {
    return (
      <View style={styles.screen}>
        <Text style={styles.locked}>Matches appear once dating opens in your country.</Text>
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
            {!!likes?.count && (
              <View style={styles.likesCard}>
                <Text style={styles.eyebrow}>LIKES YOU</Text>
                <Text style={styles.likesTitle}>
                  {likes.count} {likes.count === 1 ? 'person likes' : 'people like'} you
                </Text>
                {likes.plus ? (
                  likes.profiles.map((profile) => (
                    <View key={profile.id} style={styles.likeRow}>
                      <TasteProfileCard profile={profile} compact />
                      <Pressable style={styles.primaryBtn} onPress={() => likeBack(profile)}>
                        <Text style={styles.primaryText}>Like back</Text>
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sub}>
                    Keep swiping in Dating and they'll show up, or get ReelMates Plus to see them all now.
                  </Text>
                )}
              </View>
            )}
            <Text style={styles.eyebrow}>MUTUAL MATCHES</Text>
            <Text style={styles.heading}>You both liked each other</Text>
          </>
        }
        ListEmptyComponent={<EmptyState title="No matches yet" body="Like profiles in Dating when someone likes you back, they appear here." emoji="💞" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TasteProfileCard profile={item} compact />
            {item.introPending && <Text style={styles.intro}>Send one hello each to unlock full chat.</Text>}
            <View style={styles.actionRow}>
              <Pressable
                style={styles.ghostPill}
                onPress={() => router.push({ pathname: '/compare/[userId]', params: { userId: item.id, name: item.name } })}
              >
                <Text style={styles.ghostPillText}>Watch together ideas</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => router.push({ pathname: '/chat/[userId]', params: { userId: item.id, name: item.name } })}>
                <Text style={styles.primaryText}>Message</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.ghostBtn}
              onPress={() =>
                Alert.alert(`Block ${item.name}?`, 'You will no longer see or message each other. They are not notified.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await apiFetch('/safety/block', { method: 'POST', body: JSON.stringify({ userId: item.id }) }, token)
                        setMatches((current) => current.filter((match) => match.id !== item.id))
                      } catch (err) {
                        Alert.alert('Could not block', err instanceof Error ? err.message : 'Try again')
                      }
                    }
                  }
                ])
              }
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
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ghostPill: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10 },
  ghostPillText: { color: colors.text, fontWeight: '600' },
  screen: { flex: 1, backgroundColor: colors.bg },
  likesCard: { backgroundColor: 'rgba(255,105,147,0.10)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 16 },
  likesTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  likeRow: { gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
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
