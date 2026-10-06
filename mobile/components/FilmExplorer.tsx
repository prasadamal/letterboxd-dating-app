import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../lib/api'
import { colors, radii, type } from '../lib/theme'
import type { Collection, FilmItem, Reaction } from '../lib/types'
import { FilmRow } from './FilmRow'
import { Chip } from './ui'

// Explore: search any film, or browse the people's chart (all films or one collection), and rate inline.
export function FilmExplorer() {
  const [query, setQuery] = useState('')
  const [collections, setCollections] = useState<Collection[]>([])
  const [collection, setCollection] = useState<string | null>(null)
  const [films, setFilms] = useState<FilmItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<{ collections: Collection[] }>('/movies/collections')
      .then((data) => setCollections(data.collections || []))
      .catch(() => null)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const q = query.trim()
      const data =
        q.length >= 2
          ? await apiFetch<{ films: FilmItem[] }>(`/movies/search?q=${encodeURIComponent(q)}`)
          : await apiFetch<{ films: FilmItem[] }>(`/movies/top${collection ? `?collection=${collection}` : ''}`)
      setFilms(data.films || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load films')
    } finally {
      setLoading(false)
    }
  }, [query, collection])

  useEffect(() => {
    const timer = setTimeout(() => load(), query ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, query])

  async function rate(film: FilmItem, reaction: Reaction) {
    const previous = film.myRating
    setFilms((list) => list.map((f) => (f.id === film.id ? { ...f, myRating: reaction } : f)))
    try {
      await apiFetch(`/movies/${film.id}/rate`, { method: 'POST', body: JSON.stringify({ reaction }) })
    } catch (err) {
      setFilms((list) => list.map((f) => (f.id === film.id ? { ...f, myRating: previous } : f)))
      setError(err instanceof Error ? err.message : 'Could not save rating')
    }
  }

  const searching = query.trim().length >= 2
  const heading = searching ? 'Results' : collection ? collections.find((c) => c.key === collection)?.name || 'Collection' : "The People's Chart"

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search any film"
          placeholderTextColor={colors.faint}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search films"
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
      {!searching && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
          <Chip label="All films" selected={!collection} onPress={() => setCollection(null)} accessibilityRole="tab" />
          {collections.map((c) => (
            <Chip key={c.key} label={c.name} selected={collection === c.key} onPress={() => setCollection(c.key)} accessibilityRole="tab" />
          ))}
        </ScrollView>
      )}
      <View style={{ gap: 2 }}>
        <Text style={type.h2}>{heading}</Text>
        {!searching && <Text style={type.small}>Ranked by how many ReelMates members liked each film. Every rating counts.</Text>}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && !films.length ? <ActivityIndicator color={colors.lime} style={{ marginTop: 24 }} /> : null}
      {!loading && searching && !films.length ? <Text style={type.small}>Nothing found for “{query.trim()}”. Tell us in Settings → Send feedback.</Text> : null}
      <View style={{ gap: 10 }}>
        {films.map((film) => (
          <FilmRow key={film.id} film={film} onRate={rate} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  search: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 13 },
  chipsScroll: { marginHorizontal: -20 },
  chips: { gap: 8, paddingHorizontal: 20 },
  error: { color: colors.red }
})
