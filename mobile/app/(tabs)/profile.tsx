import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TasteStatsCard } from '../../components/TasteStatsCard'
import { Avatar, Button, Card, IconButton, PersonalityCard, Poster, SectionTitle, StatTile } from '../../components/ui'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { WEB_URL, genderLabel } from '../../lib/profileOptions'
import { colors, fonts, radii, type } from '../../lib/theme'
import type { TasteStats } from '../../lib/types'

// Your profile as others see it (plus your stats). Editing and settings live on their own screens.
export default function YouScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, refreshUser } = useAuth()
  const [stats, setStats] = useState<TasteStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const data = await apiFetch<{ stats: TasteStats }>('/users/taste-stats').catch(() => null)
    if (data) setStats(data.stats)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (!user) return null

  async function shareTasteCard() {
    if (!user?.referral_code) return
    try {
      if (!user.taste_card_public) {
        await apiFetch('/users/taste-card', { method: 'PUT', body: JSON.stringify({ public: true }) })
        await refreshUser()
      }
      const url = `${WEB_URL}/taste/${user.referral_code}`
      const label = stats?.personality?.ready ? `I'm a ${stats.personality.emoji} ${stats.personality.name} on ReelMates.` : "Here's my film taste on ReelMates."
      await Share.share({ message: `${label} How well does yours match? ${url}`, url })
    } catch (err) {
      Alert.alert('Could not share', err instanceof Error ? err.message : 'Try again')
    }
  }

  const place = [user.country || user.city, user.age ? String(user.age) : '', genderLabel(user.gender)].filter(Boolean).join(' · ')
  const personality = stats?.personality

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.lime}
          onRefresh={async () => {
            setRefreshing(true)
            await Promise.all([load(), refreshUser().catch(() => null)])
            setRefreshing(false)
          }}
        />
      }
    >
      <View style={styles.topBar}>
        <Text style={type.h1}>You</Text>
        <View style={styles.topActions}>
          <IconButton icon="create-outline" size={42} accessibilityLabel="Edit profile" onPress={() => router.push('/edit-profile')} />
          <IconButton icon="settings-outline" size={42} accessibilityLabel="Settings" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={styles.hero}>
        <Pressable onPress={() => router.push('/edit-profile')} accessibilityRole="button" accessibilityLabel="Change photo">
          <Avatar uri={user.photo_url} name={user.name} size={116} ring />
          {!user.photo_url && (
            <View style={styles.addPhoto}>
              <Ionicons name="camera" size={16} color={colors.onLime} />
            </View>
          )}
        </Pressable>
        <Text style={[type.h1, { textAlign: 'center' }]}>{user.name}</Text>
        {!!place && <Text style={type.small}>{place}</Text>}
      </View>

      {personality && <PersonalityCard personality={personality} />}

      <View style={styles.shareRow}>
        <Button title="Share my taste card" icon="share-social" onPress={shareTasteCard} style={{ flex: 1 }} disabled={!user.referral_code} />
      </View>

      <View style={styles.tiles}>
        <StatTile value={stats?.liked ?? '–'} label="Liked" color={colors.pink} />
        <StatTile value={stats?.disliked ?? '–'} label="Passed" />
        <StatTile value={stats?.notSeen ?? '–'} label="Not seen" />
        <StatTile value={user.streak?.best ?? 0} label="Best 🔥" color={colors.orange} />
      </View>

      <SectionTitle title="All-time favourite" action={user.favorite ? 'Change' : undefined} onAction={() => router.push('/edit-profile')} />
      {user.favorite?.title ? (
        <Card style={styles.favorite} onPress={() => router.push('/edit-profile')}>
          <Poster
            film={{ id: user.favorite.id, title: user.favorite.name || user.favorite.title, year: user.favorite.year, genres: user.favorite.genres }}
            width={84}
            height={118}
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.favoriteTitle}>{user.favorite.title}</Text>
            <Text style={type.small}>Shown on your card. Counts extra in every match.</Text>
          </View>
        </Card>
      ) : (
        <Card onPress={() => router.push('/edit-profile')}>
          <Text style={type.h3}>❤️ Pick your all-time favourite</Text>
          <Text style={type.small}>Just one film. People who share it get a big match boost.</Text>
        </Card>
      )}

      <SectionTitle title="Film prompts" action="Edit" onAction={() => router.push('/edit-profile')} />
      {user.prompts?.length ? (
        user.prompts.map((prompt) => (
          <View key={prompt.key} style={styles.prompt}>
            <Text style={styles.promptQuestion}>{prompt.question}</Text>
            <Text style={styles.promptAnswer}>{prompt.answer}</Text>
          </View>
        ))
      ) : (
        <Card onPress={() => router.push('/edit-profile')}>
          <Text style={type.h3}>💬 Add a film prompt</Text>
          <Text style={type.small}>“A film I will defend forever…” Prompts start the best conversations.</Text>
        </Card>
      )}

      <SectionTitle title="Your taste in numbers" />
      <TasteStatsCard stats={stats} />

      <Card onPress={() => router.push('/friends')} style={styles.row}>
        <Ionicons name="people" size={22} color={colors.lime} />
        <View style={{ flex: 1 }}>
          <Text style={type.h3}>Film friends</Text>
          <Text style={type.small}>Compare taste and find films to watch together</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Card>

      {user.plus?.active ? (
        <Card style={[styles.row, styles.plus]}>
          <Text style={styles.plusEmoji}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>ReelMates Plus</Text>
            <Text style={type.small}>Active{user.plus.until ? ` until ${new Date(user.plus.until).toLocaleDateString()}` : ''}</Text>
          </View>
        </Card>
      ) : null}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, gap: 14, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: 8 },
  hero: { alignItems: 'center', gap: 8, marginTop: 4 },
  addPhoto: { position: 'absolute', right: 2, bottom: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  shareRow: { flexDirection: 'row', gap: 10 },
  tiles: { flexDirection: 'row', gap: 8 },
  favorite: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  favoriteTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 20, lineHeight: 24, letterSpacing: -0.4 },
  prompt: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
  promptQuestion: { fontFamily: fonts.semi, color: colors.lime, fontSize: 13 },
  promptAnswer: { fontFamily: fonts.display, color: colors.text, fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  plus: { borderColor: 'rgba(255,210,63,0.4)' },
  plusEmoji: { fontSize: 24 }
})
