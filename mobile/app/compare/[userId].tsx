import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar, Card, PersonalityBadge, SectionTitle, Tag } from '../../components/ui'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors, fonts, radii, type } from '../../lib/theme'
import type { TasteComparison } from '../../lib/types'

const RELATION = {
  same: { text: 'Same as yours!', tone: 'lime' as const },
  you_liked: { text: 'You liked it too', tone: 'green' as const },
  you_disliked: { text: "You didn't like it", tone: 'red' as const },
  not_rated: { text: "You haven't rated it", tone: 'neutral' as const }
}

function verdict(score: number) {
  if (score >= 85) return 'Film soulmates 🎬'
  if (score >= 70) return 'Seriously compatible'
  if (score >= 55) return 'Good overlap'
  if (score >= 45) return 'Still figuring it out'
  return 'Opposites attract?'
}

// Taste comparison with a film friend or match, plus "watch together" ideas.
export default function CompareScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>()
  const { user } = useAuth()
  const [data, setData] = useState<TasteComparison | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<TasteComparison>(`/friends/compare/${userId}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not compare'))
  }, [userId])

  const title = data?.person.name || name || 'Compare'
  const samePersonality = data?.person.personality && data.myPersonality && data.person.personality.key === data.myPersonality.key
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title }} />
      {!data && !error && <ActivityIndicator color={colors.lime} style={{ marginTop: 60 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {data && (
        <>
          <View style={styles.hero}>
            <View style={styles.faces}>
              <Avatar uri={user?.photo_url} name={user?.name} size={84} ring />
              <View style={{ marginLeft: -18 }}>
                <Avatar uri={data.person.photo_url} name={data.person.name} size={84} ring />
              </View>
            </View>
            <Text style={styles.score}>{data.score}%</Text>
            <Text style={type.h3}>{verdict(data.score)}</Text>
            <Text style={type.small}>
              {data.sharedCount} films in common{data.conflicts ? ` · ${data.conflicts} you disagree on` : ''}
            </Text>
          </View>

          {(data.person.personality || data.myPersonality) && (
            <Card>
              <Text style={type.label}>{samePersonality ? 'Same film personality!' : 'Film personalities'}</Text>
              <View style={styles.personalities}>
                <View style={styles.personality}>
                  <Text style={type.small}>{data.person.name}</Text>
                  <PersonalityBadge personality={data.person.personality} size="sm" />
                  {!data.person.personality && <Text style={type.small}>Still a Fresh Reel</Text>}
                </View>
                <View style={styles.personality}>
                  <Text style={type.small}>You</Text>
                  <PersonalityBadge personality={data.myPersonality} size="sm" />
                  {!data.myPersonality && <Text style={type.small}>Still a Fresh Reel</Text>}
                </View>
              </View>
            </Card>
          )}

          <Card>
            <Text style={type.label}>All-time favourites</Text>
            <View style={{ gap: 6 }}>
              <Text style={styles.favLine}>
                <Text style={styles.favWho}>{data.person.name}: </Text>
                {data.theirFavorite ? data.theirFavorite.title : 'not chosen yet'}
              </Text>
              {data.theirFavorite && <Tag label={RELATION[data.theirFavorite.relation].text} tone={RELATION[data.theirFavorite.relation].tone} />}
              <Text style={styles.favLine}>
                <Text style={styles.favWho}>You: </Text>
                {data.myFavorite || 'not chosen yet (You → Edit profile)'}
              </Text>
            </View>
          </Card>

          {data.sharedLoved.length > 0 && (
            <>
              <SectionTitle title="You both loved" />
              <View style={styles.tags}>
                {data.sharedLoved.slice(0, 14).map((t) => (
                  <Tag key={t} label={t} tone="pink" icon="heart" />
                ))}
              </View>
            </>
          )}
          {data.sharedHated.length > 0 && (
            <>
              <SectionTitle title="You both passed on" />
              <View style={styles.tags}>
                {data.sharedHated.slice(0, 10).map((t) => (
                  <Tag key={t} label={t} tone="red" icon="close" />
                ))}
              </View>
            </>
          )}

          <SectionTitle title="Watch together" />
          <Card>
            {data.watchTogether.forYou.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={type.small}>{data.person.name} loved these. You haven't rated them yet:</Text>
                <View style={styles.tags}>
                  {data.watchTogether.forYou.map((t) => (
                    <Tag key={t} label={t} tone="cyan" icon="film" />
                  ))}
                </View>
              </View>
            )}
            {data.watchTogether.forThem.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={type.small}>You loved these. {data.person.name} hasn't rated them yet:</Text>
                <View style={styles.tags}>
                  {data.watchTogether.forThem.map((t) => (
                    <Tag key={t} label={t} tone="violet" icon="film" />
                  ))}
                </View>
              </View>
            )}
            {!data.watchTogether.forYou.length && !data.watchTogether.forThem.length && (
              <Text style={type.small}>Rate more films and ideas show up here.</Text>
            )}
          </Card>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  error: { color: colors.red, marginTop: 24, textAlign: 'center' },
  hero: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  faces: { flexDirection: 'row', marginBottom: 6 },
  score: { fontFamily: fonts.display, color: colors.lime, fontSize: 72, lineHeight: 76, letterSpacing: -3 },
  personalities: { flexDirection: 'row', gap: 12 },
  personality: { flex: 1, gap: 6 },
  favLine: { color: colors.text, fontSize: 15, lineHeight: 21 },
  favWho: { color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  card: { borderRadius: radii.lg }
})
