import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '../lib/api'
import { colors } from '../lib/theme'
import type { TasteStats } from '../lib/types'

function Bars({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.count))
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.sub}>{title}</Text>
      {items.map((item) => (
        <View key={item.name} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(8, (item.count / max) * 100)}%` }]} />
          </View>
          <Text style={styles.barCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  )
}

// Your taste at a glance (Letterboxd keeps stats like these behind a paid tier).
export function TasteStatsCard({ refreshKey }: { refreshKey?: unknown }) {
  const [stats, setStats] = useState<TasteStats | null>(null)

  useEffect(() => {
    apiFetch<{ stats: TasteStats }>('/users/taste-stats')
      .then((data) => setStats(data.stats))
      .catch(() => null)
  }, [refreshKey])

  if (!stats) return null
  const rated = stats.liked + stats.disliked
  return (
    <View style={styles.card}>
      <Text style={styles.label}>YOUR TASTE</Text>
      <View style={styles.tiles}>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{stats.liked}</Text>
          <Text style={styles.tileLabel}>Liked</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{stats.disliked}</Text>
          <Text style={styles.tileLabel}>Disliked</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{stats.notSeen}</Text>
          <Text style={styles.tileLabel}>Haven't seen</Text>
        </View>
      </View>
      {rated ? (
        <Text style={styles.sub}>You like {stats.likeRate}% of the films you've seen.</Text>
      ) : (
        <Text style={styles.sub}>Rate a few films to see your taste here.</Text>
      )}
      <Bars title="Genres you like most" items={stats.topGenres} />
      <Bars title="Languages you like most" items={stats.topLanguages} />
      <Bars title="Favourite decades" items={stats.topDecades} />
      {stats.leastLikedGenres.length > 0 && (
        <Text style={styles.sub}>Not for you: {stats.leastLikedGenres.map((g) => g.name).join(', ')}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 12 },
  label: { color: colors.peach, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.bgElevated, borderRadius: 14, padding: 10, alignItems: 'center' },
  tileValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  tileLabel: { color: colors.muted, fontSize: 12 },
  sub: { color: colors.muted, lineHeight: 19 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { color: colors.text, width: 96, fontSize: 13 },
  track: { flex: 1, height: 8, borderRadius: 999, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.pink },
  barCount: { color: colors.muted, width: 28, textAlign: 'right', fontSize: 12 }
})
