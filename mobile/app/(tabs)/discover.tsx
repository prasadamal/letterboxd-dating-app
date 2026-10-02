import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { apiFetch, movieLabel } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'
import type { Movie } from '../../lib/types'

export default function DiscoverScreen() {
  const { token, refreshUser } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    const data = await apiFetch<{ movies: Movie[] }>('/movies/daily', {}, token)
    setMovies(data.movies || [])
  }, [token])

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  async function rate(movie: Movie, reaction: 'love' | 'hate' | 'skip') {
    if (!token) return
    await apiFetch(`/movies/${movie.id}/rate`, { method: 'POST', body: JSON.stringify({ reaction }) }, token)
    await refreshUser()
    setMovies((current) => current.filter((item) => item.id !== movie.id))
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>DAILY PICKS</Text>
      <Text style={styles.heading}>Rate films to sharpen your matches</Text>
      <FlatList
        data={movies}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={colors.pink} />}
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>No picks left today — check back tomorrow.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.meta}>{item.genres?.[0] || 'Film'} · {item.origin_language || 'Global'}</Text>
            <Text style={styles.title}>{movieLabel(item)}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.ghostBtn} onPress={() => rate(item, 'hate')}>
                <Text style={styles.ghostText}>Dislike</Text>
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => rate(item, 'skip')}>
                <Text style={styles.ghostText}>Skip</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={() => rate(item, 'love')}>
                <Text style={styles.primaryText}>Like</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1, marginBottom: 6 },
  heading: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  meta: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  ghostBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  ghostText: { color: colors.text, fontWeight: '600' },
  primaryBtn: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.pink },
  primaryText: { color: '#fff', fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 }
})
