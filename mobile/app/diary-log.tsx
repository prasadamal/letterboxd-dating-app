import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { FilmRow } from '../components/FilmRow'
import { Button, Chip, EmptyState, Poster } from '../components/ui'
import { apiFetch } from '../lib/api'
import { useAuth } from '../lib/auth'
import { cachedEntry, deleteEntry, editEntry, logFilm } from '../lib/diary'
import { dayLabel, localDay, shiftDay, starsSpoken, tapStar, type DiaryFilm } from '../lib/diaryFormat'
import { refreshWatchlist } from '../lib/watchlist'
import { colors, fonts, radii, type } from '../lib/theme'
import type { FilmItem } from '../lib/types'

const NOTE_LIMIT = 1000

// Log a viewing (pick the film first if none was given), or edit or delete an existing diary entry.
export default function DiaryLogScreen() {
  const params = useLocalSearchParams<{ entryId?: string; filmId?: string; title?: string; year?: string }>()
  const { user } = useAuth()
  const owner = user?.id
  const existing = params.entryId ? cachedEntry(owner, params.entryId) : null
  const today = new Date()

  const [film, setFilm] = useState<DiaryFilm | null>(
    existing?.film ?? (params.filmId && params.title ? { id: Number(params.filmId), title: params.title, year: params.year ? Number(params.year) : null } : null)
  )
  const [watchedOn, setWatchedOn] = useState(existing?.watchedOn ?? localDay(today))
  const [stars, setStars] = useState<number | null>(existing?.stars ?? null)
  const [note, setNote] = useState(existing?.note ?? '')
  const [rewatch, setRewatch] = useState(existing?.rewatch ?? false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // React state updates a frame late; this stops a double tap from logging the film twice.
  const inFlight = useRef(false)

  if (params.entryId && !existing) {
    return (
      <View style={styles.screen}>
        <EmptyState emoji="📓" title="This entry isn't loaded" body="Go back to your diary and open it again.">
          <Button title="Back to diary" onPress={() => router.back()} />
        </EmptyState>
      </View>
    )
  }

  if (!film) return <FilmPicker onPick={setFilm} />

  const todayDay = localDay(today)
  const save = async () => {
    if (inFlight.current || !owner) return
    inFlight.current = true
    setBusy(true)
    setError('')
    const draft = { watchedOn, stars, note, rewatch }
    try {
      if (existing) await editEntry(owner, existing.id, draft)
      else {
        await logFilm(owner, film.id, draft)
        // Logged means watched: the server took it off the watchlist, so the bookmark follows.
        refreshWatchlist().catch(() => null)
      }
      router.back()
    } catch (err) {
      // Keep everything typed so nothing is lost; the member decides whether to try again.
      setError(err instanceof Error ? err.message : 'Could not save. Check your connection and try again.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const remove = () => {
    if (!existing || !owner) return
    Alert.alert('Delete this entry?', `${film.title}, ${dayLabel(existing.watchedOn, today)}. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (inFlight.current) return
          inFlight.current = true
          setBusy(true)
          try {
            await deleteEntry(owner, existing.id)
            router.back()
          } catch {
            setError('Could not delete. Check your connection and try again.')
          } finally {
            inFlight.current = false
            setBusy(false)
          }
        }
      }
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.filmHead}>
        <Poster film={film} width={64} height={90} variant="thumb" />
        <View style={{ flex: 1 }}>
          <Text style={styles.filmTitle} numberOfLines={3}>{film.title}</Text>
          {film.year ? <Text style={type.small}>{film.year}</Text> : null}
        </View>
        {!existing && !params.filmId ? <Button title="Change" size="sm" variant="secondary" onPress={() => setFilm(null)} /> : null}
      </View>

      <Text style={styles.label}>Watched</Text>
      <View style={styles.dateRow}>
        <Pressable onPress={() => setWatchedOn(shiftDay(watchedOn, -1))} hitSlop={8} style={styles.step} accessibilityRole="button" accessibilityLabel="Day before">
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.day} accessibilityLiveRegion="polite">{dayLabel(watchedOn, today)}</Text>
        <Pressable
          onPress={() => setWatchedOn(shiftDay(watchedOn, 1))}
          disabled={watchedOn >= todayDay}
          hitSlop={8}
          style={[styles.step, watchedOn >= todayDay && { opacity: 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="Day after"
          accessibilityState={{ disabled: watchedOn >= todayDay }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        <Chip label="Today" selected={watchedOn === todayDay} onPress={() => setWatchedOn(todayDay)} accessibilityRole="radio" />
        <Chip label="Yesterday" selected={watchedOn === localDay(today, -1)} onPress={() => setWatchedOn(localDay(today, -1))} accessibilityRole="radio" />
        <Chip label="Rewatch" icon="repeat" selected={rewatch} onPress={() => setRewatch((r) => !r)} accessibilityRole="checkbox" />
      </View>

      <Text style={styles.label}>Your rating</Text>
      <View style={styles.stars} accessibilityLabel={starsSpoken(stars)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const icon = stars != null && stars >= n * 2 ? 'star' : stars === n * 2 - 1 ? 'star-half' : 'star-outline'
          return (
            <Pressable
              key={n}
              onPress={() => setStars(tapStar(stars, n))}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n === 1 ? '' : 's'}. Tap again for a half star, again to clear.`}
            >
              <Ionicons name={icon} size={38} color={stars ? colors.gold : colors.faint} />
            </Pressable>
          )
        })}
      </View>
      <Text style={type.small}>{stars ? starsSpoken(stars) : 'Optional. Tap a star twice for a half.'}</Text>

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={styles.note}
        value={note}
        onChangeText={setNote}
        placeholder="What stayed with you? Only you can see this."
        placeholderTextColor={colors.faint}
        multiline
        maxLength={NOTE_LIMIT}
        accessibilityLabel="Note"
      />
      {note.length > NOTE_LIMIT - 100 ? <Text style={[type.small, { textAlign: 'right' }]}>{NOTE_LIMIT - note.length} left</Text> : null}

      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      <Button title={existing ? 'Save changes' : 'Log it'} icon="checkmark" onPress={save} loading={busy} disabled={busy} style={{ marginTop: 8 }} />
      {existing ? <Button title="Delete entry" variant="danger" icon="trash-outline" onPress={remove} disabled={busy} /> : null}
    </ScrollView>
  )
}

// Search any film to log. Only the newest search may fill the list.
function FilmPicker({ onPick }: { onPick: (film: DiaryFilm) => void }) {
  const [query, setQuery] = useState('')
  const [films, setFilms] = useState<FilmItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)

  useEffect(() => {
    const q = query.trim()
    const id = ++request.current
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = q.length >= 2
          ? await apiFetch<{ films: FilmItem[] }>(`/movies/search?q=${encodeURIComponent(q)}`)
          : await apiFetch<{ films: FilmItem[] }>('/movies/top?limit=20')
        if (id === request.current) setFilms(data.films || [])
      } catch {
        if (id === request.current) setError('Could not load films. Check your connection.')
      } finally {
        if (id === request.current) setLoading(false)
      }
    }, q ? 300 : 0)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={type.h2}>What did you watch?</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search any film"
          placeholderTextColor={colors.faint}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search films"
        />
      </View>
      <Text style={styles.label}>{query.trim().length >= 2 ? 'Results' : 'Popular right now'}</Text>
      {loading && !films.length ? <ActivityIndicator color={colors.lime} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && !films.length ? <Text style={type.small}>No films found. Try another spelling.</Text> : null}
      <View style={{ gap: 10 }}>
        {films.map((f) => (
          <FilmRow key={f.id} film={{ ...f, votes: undefined }} onPick={() => onPick(f)} pickLabel="Log" />
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48, gap: 10 },
  filmHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  filmTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.text, letterSpacing: -0.5 },
  label: { ...type.label, marginTop: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 8 },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardHigh },
  day: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stars: { flexDirection: 'row', gap: 6 },
  note: { minHeight: 110, textAlignVertical: 'top', backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 12, color: colors.text, fontSize: 15, lineHeight: 21 },
  error: { color: colors.red, fontSize: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 48 },
  search: { flex: 1, color: colors.text, fontSize: 16 }
})
