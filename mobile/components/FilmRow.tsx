import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../lib/theme'
import type { FilmItem, Reaction } from '../lib/types'

type Props = {
  film: FilmItem
  onRate?: (film: FilmItem, reaction: Reaction) => void
  // When set, the row is a picker (e.g. choosing your all-time favourite).
  onPick?: (film: FilmItem) => void
  pickLabel?: string
}

const CHOICES: { reaction: Reaction; label: string }[] = [
  { reaction: 'love', label: 'Like' },
  { reaction: 'hate', label: 'Dislike' },
  { reaction: 'skip', label: "Haven't seen" }
]

export function FilmRow({ film, onRate, onPick, pickLabel = 'Choose' }: Props) {
  const meta = [film.genres?.[0], film.origin_language].filter(Boolean).join(' · ')
  return (
    <View style={styles.row}>
      <View style={styles.head}>
        {film.rank ? <Text style={styles.rank}>{film.rank}</Text> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {film.title} <Text style={styles.year}>({film.year})</Text>
          </Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}
          {film.votes ? (
            <Text style={styles.people}>
              {film.likedPercent}% of people liked it · {film.votes} {film.votes === 1 ? 'rating' : 'ratings'}
            </Text>
          ) : film.votes === 0 ? (
            <Text style={styles.metaDim}>No ratings yet — be the first</Text>
          ) : null}
        </View>
        {onPick && (
          <Pressable style={styles.pick} onPress={() => onPick(film)} accessibilityRole="button">
            <Text style={styles.pickText}>{pickLabel}</Text>
          </Pressable>
        )}
      </View>
      {onRate && (
        <View style={styles.choices}>
          {CHOICES.map(({ reaction, label }) => {
            const active = film.myRating === reaction
            return (
              <Pressable
                key={reaction}
                onPress={() => onRate(film, reaction)}
                style={[styles.choice, active && (reaction === 'love' ? styles.liked : reaction === 'hate' ? styles.disliked : styles.unseen)]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 },
  head: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  rank: { color: colors.peach, fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  year: { color: colors.muted, fontWeight: '400' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  metaDim: { color: colors.muted, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  people: { color: colors.green, fontSize: 12, marginTop: 4 },
  pick: { borderRadius: 999, backgroundColor: colors.pink, paddingHorizontal: 14, paddingVertical: 8 },
  pickText: { color: '#fff', fontWeight: '700' },
  choices: { flexDirection: 'row', gap: 6 },
  choice: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, alignItems: 'center' },
  liked: { backgroundColor: 'rgba(110,231,183,0.15)', borderColor: 'rgba(110,231,183,0.5)' },
  disliked: { backgroundColor: 'rgba(251,113,133,0.15)', borderColor: 'rgba(251,113,133,0.5)' },
  unseen: { backgroundColor: 'rgba(154,167,184,0.15)', borderColor: 'rgba(154,167,184,0.5)' },
  choiceText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  choiceTextActive: { color: colors.text }
})
