import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiFetch } from '../lib/api'
import { colors, fonts, radii, type } from '../lib/theme'
import type { FilmItem, User } from '../lib/types'
import { FilmRow } from './FilmRow'
import { Button, Poster } from './ui'

type Props = { user: User; onSaved: () => Promise<void> | void }

// One all-time favourite film. Shown on your card and counted extra in matching.
export function FavoriteFilmPicker({ user, onSaved }: Props) {
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FilmItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      apiFetch<{ films: FilmItem[] }>(`/movies/search?q=${encodeURIComponent(query.trim())}`)
        .then((data) => setResults(data.films || []))
        .catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [open, query])

  async function save(movieId: number | null) {
    setError('')
    try {
      await apiFetch('/users/favorite', { method: 'PUT', body: JSON.stringify({ movieId }) })
      await onSaved()
      setOpen(false)
      setQuery('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    }
  }

  const fav = user.favorite
  return (
    <View style={styles.block}>
      {fav?.title ? (
        <View style={styles.current}>
          <Poster film={{ id: fav.id, title: fav.name || fav.title, year: fav.year, genres: fav.genres }} width={64} height={90} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.value}>{fav.title}</Text>
            <View style={styles.row}>
              <Button title="Change" size="sm" variant="secondary" onPress={() => setOpen(true)} />
              <Button title="Remove" size="sm" variant="ghost" onPress={() => save(null)} />
            </View>
          </View>
        </View>
      ) : (
        <Pressable style={styles.empty} onPress={() => setOpen(true)} accessibilityRole="button">
          <Ionicons name="heart-outline" size={22} color={colors.pink} />
          <Text style={styles.emptyText}>Choose your all-time favourite</Text>
        </Pressable>
      )}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 8 }]}>
          <Text style={type.h1}>Your all-time favourite</Text>
          <Text style={type.small}>Just one. Sharing it with someone is a big match boost.</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for the film"
              placeholderTextColor={colors.faint}
              autoFocus
              autoCorrect={false}
            />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {results.map((film) => (
              <FilmRow key={film.id} film={film} onPick={(f) => save(f.id)} pickLabel="This one" />
            ))}
            {query.trim().length >= 2 && !results.length && (
              <Text style={type.small}>Not in our catalog yet. Tell us in Settings → Send feedback.</Text>
            )}
          </ScrollView>
          <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  current: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 12 },
  value: { fontFamily: fonts.bold, color: colors.text, fontSize: 17 },
  row: { flexDirection: 'row', gap: 6, marginTop: 4 },
  empty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: 'dashed', borderRadius: radii.lg, paddingVertical: 18 },
  emptyText: { fontFamily: fonts.semi, color: colors.text, fontSize: 15 },
  modal: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  search: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 13 },
  error: { color: colors.red }
})
