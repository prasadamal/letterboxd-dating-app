import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, EmptyState, Poster, StatTile, Tag } from '../components/ui'
import { useAuth } from '../lib/auth'
import { loadDiary, type DiaryEntry } from '../lib/diary'
import { dayLabel, diaryStats, groupByMonth, starsSpoken, starsText, weekdayShort } from '../lib/diaryFormat'
import { colors, fonts, radii, type } from '../lib/theme'

// Your film diary: every film you watched, when, how much you liked it and what you thought.
export default function DiaryScreen() {
  const { user } = useAuth()
  const owner = user?.id
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const request = useRef(0)

  const load = useCallback(async () => {
    if (!owner) return
    // Only the newest request for the current account may update the screen.
    const id = ++request.current
    try {
      const list = await loadDiary(owner)
      if (id !== request.current) return
      setEntries(list)
      setStatus('ready')
    } catch {
      if (id === request.current) setStatus((current) => (current === 'ready' ? 'ready' : 'error'))
    }
  }, [owner])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  const today = new Date()
  const stats = useMemo(() => diaryStats(entries, new Date()), [entries])
  const groups = useMemo(() => groupByMonth(entries), [entries])
  const log = () => router.push('/diary-log')

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
        <ActivityIndicator color={colors.lime} style={{ marginTop: 40 }} accessibilityLabel="Loading your diary" />
      ) : status === 'error' ? (
        <EmptyState emoji="📡" title="Could not load your diary" body="Check your connection and try again.">
          <Button title="Try again" onPress={() => { setStatus('loading'); void load() }} />
        </EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState
          emoji="📓"
          title="Start your film diary"
          body="Log every film you watch: the day, a star rating and a few words. It's private to you, and it's yours even without a single match."
        >
          <Button title="Log a film" icon="add" onPress={log} />
        </EmptyState>
      ) : (
        <>
          <View style={styles.tiles}>
            <StatTile value={stats.thisYear} label={`In ${today.getFullYear()}`} color={colors.lime} />
            <StatTile value={stats.thisMonth} label="This month" />
            <StatTile value={stats.films} label="Films" />
            <StatTile value={stats.average == null ? '–' : `${stats.average}★`} label="Average" color={colors.gold} />
          </View>
          <Button title="Log a film" icon="add" onPress={log} style={{ marginBottom: 8 }} />
          {groups.map((group) => (
            <View key={group.key} style={{ gap: 10 }}>
              <Text style={styles.month} accessibilityRole="header">
                {group.title} · {group.entries.length}
              </Text>
              {group.entries.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push({ pathname: '/diary-log', params: { entryId: entry.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.film.title}, watched ${dayLabel(entry.watchedOn, today)}, ${starsSpoken(entry.stars)}${entry.rewatch ? ', rewatch' : ''}. Edit`}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.cardHigh }]}
                >
                  <View style={styles.date}>
                    <Text style={styles.dateDay}>{Number(entry.watchedOn.slice(8, 10))}</Text>
                    <Text style={styles.dateWeek}>{weekdayShort(entry.watchedOn)}</Text>
                  </View>
                  <Poster film={entry.film} width={44} height={62} variant="thumb" />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.title} numberOfLines={2}>
                      {entry.film.title} <Text style={styles.year}>{entry.film.year}</Text>
                    </Text>
                    <View style={styles.meta}>
                      {entry.stars ? <Text style={styles.stars}>{starsText(entry.stars)}</Text> : null}
                      {entry.rewatch ? <Tag label="Rewatch" tone="cyan" icon="repeat" /> : null}
                    </View>
                    {entry.note ? <Text style={styles.note} numberOfLines={3}>{entry.note}</Text> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  tiles: { flexDirection: 'row', gap: 8 },
  month: { ...type.label, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 12 },
  date: { width: 34, alignItems: 'center', paddingTop: 2 },
  dateDay: { fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: -0.5 },
  dateWeek: { fontFamily: fonts.semi, fontSize: 11, color: colors.muted, textTransform: 'uppercase' },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 16, lineHeight: 20 },
  year: { fontFamily: fonts.medium, color: colors.faint, fontSize: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stars: { color: colors.gold, fontSize: 15, letterSpacing: 1 },
  note: { ...type.small, color: colors.soft }
})
