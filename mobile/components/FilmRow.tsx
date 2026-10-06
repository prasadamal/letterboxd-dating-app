import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { haptic } from '../lib/haptics'
import { colors, fonts, radii } from '../lib/theme'
import type { FilmItem, Reaction } from '../lib/types'
import { Button, Poster, type IconName } from './ui'

type Props = {
  film: FilmItem
  onRate?: (film: FilmItem, reaction: Reaction) => void
  // When set, the row is a picker (e.g. choosing your all-time favourite).
  onPick?: (film: FilmItem) => void
  pickLabel?: string
}

const CHOICES: { reaction: Reaction; icon: IconName; label: string; color: string }[] = [
  { reaction: 'love', icon: 'heart', label: 'Liked it', color: colors.pink },
  { reaction: 'hate', icon: 'close', label: "Didn't like it", color: colors.red },
  { reaction: 'skip', icon: 'eye-off', label: "Haven't seen it", color: colors.cyan }
]

export function FilmRow({ film, onRate, onPick, pickLabel = 'Pick' }: Props) {
  const meta = [film.genres?.[0], film.origin_language].filter(Boolean).join(' · ')
  return (
    <View style={styles.row}>
      {film.rank ? <Text style={[styles.rank, film.rank <= 3 && styles.rankTop]}>{film.rank}</Text> : null}
      <Poster film={film} width={52} height={72} variant="thumb" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {film.title} <Text style={styles.year}>{film.year}</Text>
        </Text>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}
        {film.votes ? (
          <View style={styles.crowd}>
            <View style={styles.crowdTrack}>
              <View style={[styles.crowdFill, { width: `${film.likedPercent ?? 0}%` }]} />
            </View>
            <Text style={styles.crowdText}>{film.likedPercent}% liked</Text>
          </View>
        ) : film.votes === 0 ? (
          <Text style={styles.first}>No ratings yet. Be the first</Text>
        ) : null}
        {onRate && (
          <View style={styles.choices}>
            {CHOICES.map(({ reaction, icon, label, color }) => {
              const active = film.myRating === reaction
              return (
                <Pressable
                  key={reaction}
                  onPress={() => {
                    haptic.select()
                    onRate(film, reaction)
                  }}
                  hitSlop={4}
                  style={[styles.choice, active && { backgroundColor: color, borderColor: color }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}: ${film.title}`}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={icon} size={16} color={active ? '#fff' : colors.muted} />
                </Pressable>
              )
            })}
          </View>
        )}
      </View>
      {onPick && <Button title={pickLabel} size="sm" onPress={() => onPick(film)} />}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 12 },
  rank: { fontFamily: fonts.display, color: colors.faint, fontSize: 22, minWidth: 30, textAlign: 'center', letterSpacing: -1 },
  rankTop: { color: colors.lime },
  info: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.bold, color: colors.text, fontSize: 16, lineHeight: 20 },
  year: { fontFamily: fonts.medium, color: colors.faint, fontSize: 14 },
  meta: { color: colors.muted, fontSize: 12 },
  crowd: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  crowdTrack: { flex: 1, maxWidth: 120, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  crowdFill: { height: 5, borderRadius: 3, backgroundColor: colors.lime },
  crowdText: { fontFamily: fonts.semi, color: colors.soft, fontSize: 12 },
  first: { color: colors.faint, fontSize: 12, fontStyle: 'italic' },
  choices: { flexDirection: 'row', gap: 8, marginTop: 6 },
  choice: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }
})
