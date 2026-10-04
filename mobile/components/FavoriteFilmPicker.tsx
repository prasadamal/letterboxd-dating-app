import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../lib/api'
import { colors } from '../lib/theme'
import type { FilmItem, User } from '../lib/types'
import { FilmRow } from './FilmRow'

type Props = { user: User; onSaved: () => Promise<void> | void }

// One all-time favourite film. Shown on your card and counted in matching.
export function FavoriteFilmPicker({ user, onSaved }: Props) {
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

  return (
    <View style={styles.block}>
      <Text style={styles.label}>ALL-TIME FAVOURITE FILM</Text>
      <Text style={styles.value}>{user.favorite?.title || 'Not chosen yet'}</Text>
      <Text style={styles.hint}>Just one. It shows on your card and counts extra in matching.</Text>
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => setOpen(true)} accessibilityRole="button">
          <Text style={styles.buttonText}>{user.favorite ? 'Change' : 'Choose your favourite'}</Text>
        </Pressable>
        {user.favorite && (
          <Pressable style={styles.ghost} onPress={() => save(null)} accessibilityRole="button">
            <Text style={styles.ghostText}>Remove</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Your all-time favourite</Text>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for the film"
            placeholderTextColor={colors.muted}
            autoFocus
            autoCorrect={false}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {results.map((film) => (
              <FilmRow key={film.id} film={film} onPick={(f) => save(f.id)} pickLabel="This one" />
            ))}
            {query.trim().length >= 2 && !results.length && (
              <Text style={styles.hint}>Not in our catalog yet — tell us in Profile → Send feedback.</Text>
            )}
          </ScrollView>
          <Pressable style={styles.ghost} onPress={() => setOpen(false)}>
            <Text style={styles.ghostText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 },
  label: { color: colors.peach, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  value: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hint: { color: colors.muted, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  button: { backgroundColor: colors.pink, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
  ghost: { paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  ghostText: { color: colors.muted, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: colors.bg, padding: 16, paddingTop: 56, gap: 12 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  search: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  error: { color: colors.error }
})
