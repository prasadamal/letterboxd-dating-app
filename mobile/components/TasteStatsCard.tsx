import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii, type } from '../lib/theme'
import type { TasteStats } from '../lib/types'

const BAR_COLORS = [colors.lime, colors.cyan, colors.violet, colors.pink, colors.orange]

function Bars({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  if (!items.length) return null
  const max = Math.max(...items.map((i) => i.count))
  return (
    <View style={{ gap: 8 }}>
      <Text style={type.label}>{title}</Text>
      {items.map((item, i) => (
        <View key={item.name} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(8, (item.count / max) * 100)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
          </View>
          <Text style={styles.barCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  )
}

// Your taste at a glance: what you like by genre, language and decade (free; Letterboxd charges for stats).
export function TasteStatsCard({ stats }: { stats: TasteStats | null }) {
  if (!stats) return null
  const rated = stats.liked + stats.disliked
  if (!rated) {
    return (
      <View style={styles.card}>
        <Text style={type.small}>Rate a few films and your taste shows up here.</Text>
      </View>
    )
  }
  return (
    <View style={styles.card}>
      <View style={styles.rateRow}>
        <Text style={styles.rate}>{stats.likeRate}%</Text>
        <Text style={[type.small, { flex: 1 }]}>of the films you've seen, you liked.</Text>
      </View>
      <Bars title="Genres you love" items={stats.topGenres} />
      <Bars title="Languages" items={stats.topLanguages} />
      <Bars title="Decades" items={stats.topDecades} />
      {stats.leastLikedGenres.length > 0 && (
        <Text style={type.small}>Not your thing: {stats.leastLikedGenres.map((g) => g.name).join(', ')}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 16 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rate: { fontFamily: fonts.display, color: colors.lime, fontSize: 36, letterSpacing: -1.2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { color: colors.text, width: 92, fontSize: 13 },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  barCount: { fontFamily: fonts.semi, color: colors.muted, width: 28, textAlign: 'right', fontSize: 12 }
})
