import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { colors } from '../../lib/theme'
import type { Movie, Reaction } from '../../lib/types'
import { DraggableDailyGame } from '../../components/DraggableDailyGame'
import { FilmExplorer } from '../../components/FilmExplorer'

export default function TasteScreen() {
  const { token, refreshUser } = useAuth()
  const { platform, refreshPlatform } = usePlatform()
  const [movies, setMovies] = useState<Movie[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'today' | 'explore'>('today')

  const load = useCallback(async () => {
    if (!token) return
    const data = await apiFetch<{ movies: Movie[] }>('/movies/daily', {}, token)
    setMovies(data.movies || [])
  }, [token])

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load today’s films'))
  }, [load])

  async function rate(movie: Movie, reaction: Reaction) {
    if (!token) return
    try {
      await apiFetch(`/movies/${movie.id}/rate`, { method: 'POST', body: JSON.stringify({ reaction }) }, token)
      await refreshUser()
      setMovies((current) => current.filter((item) => item.id !== movie.id))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that rating')
      throw err
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true)
            await Promise.all([load(), refreshPlatform()])
            setRefreshing(false)
          }}
          tintColor={colors.pink}
        />
      }
    >
      <View style={styles.segment}>
        {(['today', 'explore'] as const).map((key) => (
          <Pressable
            key={key}
            style={[styles.segmentItem, view === key && styles.segmentOn]}
            onPress={() => setView(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === key }}
          >
            <Text style={[styles.segmentText, view === key && styles.segmentTextOn]}>
              {key === 'today' ? "Today's films" : 'Explore & chart'}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === 'explore' ? (
        <FilmExplorer />
      ) : (
        <>
          <Text style={styles.eyebrow}>DAILY TASTE GAME</Text>
          <Text style={styles.heading}>Today's films — the same for everyone</Text>
          {!platform?.datingLaunched && (
            <Text style={styles.note}>
              Dating unlocks at {platform?.maleTarget ?? 500} men + {platform?.femaleTarget ?? 500} women. Keep playing daily.
            </Text>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <DraggableDailyGame movies={movies} onRate={rate} />
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1, marginBottom: 6 },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  note: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  error: { color: colors.error, marginBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 999, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  segmentItem: { flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.pink },
  segmentText: { color: colors.muted, fontWeight: '700' },
  segmentTextOn: { color: '#fff' }
})
