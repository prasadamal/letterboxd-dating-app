import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { colors } from '../../lib/theme'
import type { TasteComparison } from '../../lib/types'

const RELATION_TEXT = {
  same: 'Same as yours!',
  you_liked: 'You liked it too',
  you_disliked: "You didn't like it",
  not_rated: "You haven't rated it"
} as const

function Chips({ titles, tone }: { titles: string[]; tone: 'liked' | 'disliked' | 'neutral' }) {
  return (
    <View style={styles.chips}>
      {titles.map((title) => (
        <View key={title} style={[styles.chip, tone === 'liked' ? styles.liked : tone === 'disliked' ? styles.disliked : styles.neutral]}>
          <Text style={styles.chipText}>{title}</Text>
        </View>
      ))}
    </View>
  )
}

// Taste comparison with a film friend or match, plus "watch together" ideas built from what each of you hasn't seen.
export default function CompareScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>()
  const [data, setData] = useState<TasteComparison | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<TasteComparison>(`/friends/compare/${userId}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not compare'))
  }, [userId])

  const title = data?.person.name || name || 'Compare'
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <Stack.Screen options={{ title }} />
      {!data && !error && <ActivityIndicator color={colors.pink} style={{ marginTop: 40 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {data && (
        <>
          <View style={styles.header}>
            <Image source={{ uri: data.person.photo_url || data.person.avatar_url }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.score}>{data.score}% taste match</Text>
              <Text style={styles.sub}>
                {data.sharedCount} films in common{data.conflicts ? ` · ${data.conflicts} you disagree on` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>ALL-TIME FAVOURITES</Text>
            <Text style={styles.body}>
              {data.person.name}: {data.theirFavorite ? data.theirFavorite.title : 'not chosen yet'}
              {data.theirFavorite ? `  ·  ${RELATION_TEXT[data.theirFavorite.relation]}` : ''}
            </Text>
            <Text style={styles.body}>You: {data.myFavorite || 'not chosen yet (Profile → favourite)'}</Text>
          </View>

          {data.sharedLoved.length > 0 && (
            <View style={styles.card}>
              <Text style={[styles.label, { color: colors.green }]}>YOU BOTH LIKED</Text>
              <Chips titles={data.sharedLoved.slice(0, 12)} tone="liked" />
            </View>
          )}
          {data.sharedHated.length > 0 && (
            <View style={styles.card}>
              <Text style={[styles.label, { color: colors.error }]}>YOU BOTH DISLIKED</Text>
              <Chips titles={data.sharedHated.slice(0, 12)} tone="disliked" />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.label}>WATCH TOGETHER</Text>
            {data.watchTogether.forYou.length > 0 && (
              <>
                <Text style={styles.body}>{data.person.name} loved these — you haven't rated them yet:</Text>
                <Chips titles={data.watchTogether.forYou} tone="neutral" />
              </>
            )}
            {data.watchTogether.forThem.length > 0 && (
              <>
                <Text style={styles.body}>You loved these — {data.person.name} hasn't rated them yet:</Text>
                <Chips titles={data.watchTogether.forThem} tone="neutral" />
              </>
            )}
            {!data.watchTogether.forYou.length && !data.watchTogether.forThem.length && (
              <Text style={styles.sub}>Rate more films and ideas will appear here.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.bgElevated },
  score: { color: colors.peach, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.muted, lineHeight: 20 },
  body: { color: colors.text, lineHeight: 21 },
  error: { color: colors.error, marginTop: 24 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  label: { color: colors.peach, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  liked: { backgroundColor: 'rgba(110,231,183,0.10)', borderColor: 'rgba(110,231,183,0.35)' },
  disliked: { backgroundColor: 'rgba(251,113,133,0.10)', borderColor: 'rgba(251,113,133,0.35)' },
  neutral: { backgroundColor: 'rgba(244,162,97,0.10)', borderColor: 'rgba(244,162,97,0.35)' },
  chipText: { color: colors.text, fontSize: 13 }
})
