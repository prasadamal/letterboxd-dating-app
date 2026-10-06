import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DailyResultsCard } from '../../components/DailyResultsCard'
import { FilmSwipeDeck } from '../../components/FilmSwipeDeck'
import { Avatar, Button, Card, MatchPill, ProgressBar, SectionTitle } from '../../components/ui'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { haptic } from '../../lib/haptics'
import { usePlatform } from '../../lib/platform'
import { WEB_URL } from '../../lib/profileOptions'
import { colors, fonts, radii, type } from '../../lib/theme'
import type { DailyResults, Friend, Movie, Reaction, Streak } from '../../lib/types'

const DEFAULT_DAILY_COUNT = 10

export default function TodayScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, refreshUser } = useAuth()
  const { platform, refreshPlatform } = usePlatform()
  const [movies, setMovies] = useState<Movie[] | null>(null)
  const [number, setNumber] = useState<number | null>(null)
  const [results, setResults] = useState<DailyResults | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [myCode, setMyCode] = useState('')
  const [streak, setStreak] = useState<Streak | null>(null)
  const [later, setLater] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const loadedDay = useRef('')

  const loadResults = useCallback(async () => {
    const data = await apiFetch<{ results: DailyResults }>('/movies/daily/results')
    setResults(data.results)
    setStreak(data.results.streak)
  }, [])

  const load = useCallback(async () => {
    setError('')
    try {
      const [daily, people] = await Promise.all([
        apiFetch<{ movies: Movie[]; number: number }>('/movies/daily'),
        apiFetch<{ friends: Friend[]; myCode: string }>('/friends').catch(() => ({ friends: [] as Friend[], myCode: '' }))
      ])
      setMovies(daily.movies)
      setNumber(daily.number)
      setFriends(people.friends)
      setMyCode(people.myCode)
      loadedDay.current = new Date().toISOString().slice(0, 10)
      // Rated films are no longer in `movies`; the results carry the full count and everyone's verdicts.
      await loadResults().catch(() => null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load today's films")
    }
  }, [loadResults])

  // Reload when the tab comes back into focus on a new UTC day (new films) or for the first time.
  useFocusEffect(
    useCallback(() => {
      if (loadedDay.current !== new Date().toISOString().slice(0, 10)) load()
    }, [load])
  )

  const remaining = movies?.length ?? 0
  const deckTotal = Math.max(results?.total ?? 0, remaining, DEFAULT_DAILY_COUNT)

  async function rate(movie: Movie, reaction: Reaction) {
    const data = await apiFetch<{ streak?: Streak | null }>(`/movies/${movie.id}/rate`, { method: 'POST', body: JSON.stringify({ reaction }) })
    if (data.streak) setStreak(data.streak)
    setMovies((list) => (list || []).filter((m) => m.id !== movie.id))
  }

  // Finishing the day: celebrate, then load everyone's verdicts and the updated profile (streak, personality).
  const previousRemaining = useRef<number | null>(null)
  useEffect(() => {
    const before = previousRemaining.current
    previousRemaining.current = movies === null ? null : remaining
    if (before && remaining === 0) {
      haptic.success()
      loadResults().catch(() => null)
      refreshUser().catch(() => null)
    }
  }, [movies, remaining, loadResults, refreshUser])

  const playing = remaining > 0 && !later
  const currentStreak = streak?.current ?? user?.streak?.current ?? 0
  const datingOn = user?.dating_enabled !== false
  const country = platform?.country

  const streakPill = (
    <View style={[styles.streakPill, !currentStreak && { opacity: 0.6 }]} accessibilityLabel={`${currentStreak} day streak`}>
      <Text style={styles.streakText}>🔥 {currentStreak}</Text>
    </View>
  )

  if (movies === null) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        {error ? (
          <>
            <Text style={type.h3}>{error}</Text>
            <Button title="Try again" variant="secondary" onPress={load} />
          </>
        ) : (
          <ActivityIndicator color={colors.lime} size="large" />
        )}
      </View>
    )
  }

  if (playing) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.playHeader, { paddingHorizontal: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={type.label}>Daily #{number} · same films for everyone</Text>
            <Text style={type.h1}>Today</Text>
          </View>
          {streakPill}
        </View>
        <FilmSwipeDeck movies={movies} total={Math.max(deckTotal, 1)} onRate={rate} />
        <Pressable onPress={() => setLater(true)} style={styles.laterBtn} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.laterText}>Finish later</Text>
        </Pressable>
      </View>
    )
  }

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
            await Promise.all([load(), refreshPlatform().catch(() => null)])
            setRefreshing(false)
          }}
        />
      }
    >
      <View style={styles.playHeader}>
        <View style={{ flex: 1 }}>
          <Text style={type.label}>Daily #{number}</Text>
          <Text style={type.h1}>Today</Text>
        </View>
        {streakPill}
      </View>

      {remaining > 0 && (
        <Card style={styles.leftCard}>
          <Text style={type.h3}>{remaining} {remaining === 1 ? 'film' : 'films'} left today</Text>
          <Text style={type.small}>Finish them to keep your streak and see how everyone voted.</Text>
          <Button title="Keep swiping" icon="play" size="md" onPress={() => setLater(false)} />
        </Card>
      )}

      {results && results.played > 0 && <DailyResultsCard results={results} />}

      <SectionTitle title="Your film people" action={friends.length ? 'See all' : undefined} onAction={() => router.push('/friends')} />
      {friends.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
          {friends.slice(0, 8).map((friend) => (
            <Pressable
              key={friend.id}
              style={styles.person}
              onPress={() => router.push({ pathname: '/compare/[userId]', params: { userId: friend.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${friend.name}, ${friend.score}% match`}
            >
              <View>
                <Avatar uri={friend.photo_url} name={friend.name} size={64} ring />
                {/* Their film personality as a sticker on the avatar. */}
                {friend.personality && (
                  <View style={styles.sticker} accessibilityLabel={friend.personality.name}>
                    <Text style={styles.stickerText}>{friend.personality.emoji}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.personName} numberOfLines={1}>{friend.name}</Text>
              <MatchPill score={friend.score} size="sm" />
            </Pressable>
          ))}
          <Pressable style={[styles.person, styles.addPerson]} onPress={() => router.push('/friends')} accessibilityRole="button" accessibilityLabel="Add a friend">
            <View style={styles.addCircle}>
              <Ionicons name="add" size={28} color={colors.lime} />
            </View>
            <Text style={styles.personName}>Add</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <Card>
          <Text style={type.h3}>Who has your taste?</Text>
          <Text style={type.small}>Add friends with their code and see your taste match, shared favourites and films to watch together.</Text>
          <View style={styles.inviteRow}>
            <Button
              title="Invite friends"
              icon="share-social"
              size="md"
              style={{ flex: 1 }}
              disabled={!myCode}
              onPress={() =>
                Share.share({
                  message: `Swipe today's films with me on ReelMates and see how our taste matches 🎬 My code: ${myCode} ${WEB_URL}`
                }).catch(() => null)
              }
            />
            <Button title="Add by code" variant="secondary" size="md" onPress={() => router.push('/friends')} />
          </View>
        </Card>
      )}

      {datingOn && (
        <>
          <SectionTitle title="Dating" />
          {platform?.datingLaunched ? (
            <Card onPress={() => router.push('/(tabs)/dating')} style={styles.datingLive}>
              <Text style={styles.datingEmoji}>💘</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={type.h3}>Your deck is live{platform.regionOnly && country ? ` in ${country.name}` : ''}</Text>
                <Text style={type.small}>Ranked by taste match, not looks.</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.muted} />
            </Card>
          ) : (
            <Card>
              <Text style={type.h3}>{country ? `Dating opens in ${country.name} soon` : 'Dating opens soon'}</Text>
              <ProgressBar value={country?.progressPercent ?? platform?.progressPercent ?? 0} />
              <Text style={type.small}>
                {country?.progressPercent ?? platform?.progressPercent ?? 0}% of the way there. We open a country once enough people of each gender join, so every deck is full from day one.
              </Text>
              <Button
                title="Invite friends to open it sooner"
                variant="secondary"
                size="md"
                icon="paper-plane-outline"
                disabled={!myCode}
                onPress={() => Share.share({ message: `Join me on ReelMates, the app that matches people by film taste 🎬 Code: ${myCode} ${WEB_URL}` }).catch(() => null)}
              />
            </Card>
          )}
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  content: { paddingHorizontal: 20, gap: 14 },
  playHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 6 },
  streakPill: { backgroundColor: 'rgba(255,138,61,0.16)', borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 4 },
  streakText: { fontFamily: fonts.bold, color: colors.orange, fontSize: 16 },
  laterBtn: { alignSelf: 'center', marginTop: 10, padding: 6 },
  laterText: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  leftCard: { borderColor: 'rgba(212,255,63,0.35)' },
  peopleRow: { gap: 12, paddingRight: 20 },
  person: { width: 96, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, paddingHorizontal: 6 },
  personName: { fontFamily: fonts.bold, color: colors.text, fontSize: 14, maxWidth: 84 },
  sticker: { position: 'absolute', right: -4, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cardHigh, borderWidth: 2, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stickerText: { fontSize: 14 },
  addPerson: { justifyContent: 'center', borderStyle: 'dashed' },
  addCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  inviteRow: { flexDirection: 'row', gap: 8 },
  datingLive: { flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: 'rgba(255,79,154,0.4)' },
  datingEmoji: { fontSize: 32 }
})
