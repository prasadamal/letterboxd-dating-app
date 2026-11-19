import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FilmRow } from '../components/FilmRow'
import { Button, EmptyState } from '../components/ui'
import { colors, type } from '../lib/theme'
import { refreshWatchlist, useWatchlist, type WatchFilm } from '../lib/watchlist'

// Films you saved to watch later. Removing one here takes it off at once; rating it elsewhere does too.
export default function WatchlistScreen() {
  const { ids, owner } = useWatchlist()
  const [films, setFilms] = useState<WatchFilm[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setFilms(await refreshWatchlist())
      setStatus('ready')
    } catch {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'))
    }
  }, [])

  // Reload whenever the screen comes back into view, and when the signed-in account changes.
  useFocusEffect(
    useCallback(() => {
      if (owner) void load()
    }, [load, owner])
  )

  // A film removed with its bookmark disappears from this list straight away.
  const visible = films.filter((film) => ids.has(film.id))

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.lime}
          onRefresh={async () => {
            setRefreshing(true)
            await load()
            setRefreshing(false)
          }}
        />
      }
    >
      {status === 'loading' ? (
        <ActivityIndicator color={colors.lime} style={{ marginTop: 40 }} />
      ) : status === 'error' ? (
        <EmptyState emoji="📡" title="Could not load your watchlist" body="Check your connection and try again.">
          <Button title="Try again" onPress={() => { setStatus('loading'); void load() }} />
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState
          emoji="🔖"
          title="Nothing saved yet"
          body="Tap the bookmark on a film you haven't seen, in today's results or in Explore, and it lands here."
        />
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={styles.count}>{visible.length === 1 ? '1 film to watch' : `${visible.length} films to watch`}</Text>
          {visible.map((film) => (
            <FilmRow key={film.id} film={{ ...film, tags: [], myRating: null }} showSave />
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  count: { ...type.small }
})
