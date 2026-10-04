import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../lib/api'
import { colors } from '../lib/theme'
import type { Collection, FilmItem, Reaction } from '../lib/types'
import { FilmRow } from './FilmRow'

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
      if (q.length >= 2) {
        const data = await apiFetch<{ films: FilmItem[] }>(`/movies/search?q=${encodeURIComponent(q)}`)
        setFilms(data.films || [])
      } else {
        const data = await apiFetch<{ films: FilmItem[] }>(`/movies/top${collection ? `?collection=${collection}` : ''}`)
        setFilms(data.films || [])
      }
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
  const heading = searching
    ? 'Search results'
    : collection
      ? collections.find((c) => c.key === collection)?.name || 'Collection'
      : "People's chart"

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search any film"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        autoCorrect={false}
      />
      {!searching && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable style={[styles.chip, !collection && styles.chipOn]} onPress={() => setCollection(null)}>
            <Text style={[styles.chipText, !collection && styles.chipTextOn]}>All films</Text>
          </Pressable>
          {collections.map((c) => (
            <Pressable key={c.key} style={[styles.chip, collection === c.key && styles.chipOn]} onPress={() => setCollection(c.key)}>
              <Text style={[styles.chipText, collection === c.key && styles.chipTextOn]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Text style={styles.heading}>{heading}</Text>
      {!searching && (
        <Text style={styles.sub}>Ranked by how many ReelMates people liked each film. Every rating counts.</Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && !films.length ? <ActivityIndicator color={colors.pink} style={{ marginTop: 24 }} /> : null}
      {!loading && searching && !films.length ? <Text style={styles.sub}>No films found for “{query.trim()}”.</Text> : null}
      <View style={{ gap: 10 }}>
        {films.map((film) => (
          <FilmRow key={film.id} film={film} onRate={rate} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  search: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  chipText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  chipTextOn: { color: '#fff' },
  heading: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  sub: { color: colors.muted, lineHeight: 20 },
  error: { color: colors.error }
})
