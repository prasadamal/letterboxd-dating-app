import { LinearGradient } from 'expo-linear-gradient'
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { colors, radii } from '../lib/theme'
import type { DatingProfile } from '../lib/types'

type Props = {
  profile: Pick<
    DatingProfile,
    'name' | 'age' | 'country' | 'city' | 'bio' | 'avatar_url' | 'photo_url' | 'score' | 'sharedCount' | 'sharedLoved' | 'sharedHated'
  >
  compact?: boolean
}

const CHIPS_FULL = 4
const CHIPS_COMPACT = 2

function FilmChips({ titles, tone, max }: { titles: string[]; tone: 'liked' | 'disliked'; max: number }) {
  const shown = titles.slice(0, max)
  const more = titles.length - shown.length
  return (
    <View style={styles.chips}>
      {shown.map((title) => (
        <View key={title} style={[styles.chip, tone === 'liked' ? styles.chipLiked : styles.chipDisliked]}>
          <Text style={styles.chipText} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ))}
      {more > 0 && <Text style={styles.more}>+{more} more</Text>}
    </View>
  )
}

// Card layout: the person first (big photo, name, age, place), then what you agree on.
export function TasteProfileCard({ profile, compact = false }: Props) {
  const { height } = useWindowDimensions()
  const loved = profile.sharedLoved || []
  const hated = profile.sharedHated || []
  const place = [profile.city, profile.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')
  const photo = profile.photo_url || profile.avatar_url
  const max = compact ? CHIPS_COMPACT : CHIPS_FULL
  const common = profile.sharedCount ?? loved.length + hated.length

  const taste = (
    <View style={[styles.taste, compact && styles.tasteCompact]}>
      <View style={styles.matchRow}>
        <Text style={styles.match}>{Math.round(profile.score)}% taste match</Text>
        <Text style={styles.common}>{common ? `${common} films in common` : 'No films in common yet'}</Text>
      </View>
      {loved.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.green }]}>YOU BOTH LIKED</Text>
          <FilmChips titles={loved} tone="liked" max={max} />
        </View>
      )}
      {hated.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.error }]}>YOU BOTH DISLIKED</Text>
          <FilmChips titles={hated} tone="disliked" max={max} />
        </View>
      )}
      {!compact && !loved.length && !hated.length && (
        <Text style={styles.hint}>Keep playing the daily game — shared films appear here.</Text>
      )}
    </View>
  )

  if (compact) {
    return (
      <View style={[styles.card, styles.compactCard]}>
        <View style={styles.compactHead}>
          <Image source={{ uri: photo }} style={styles.thumb} accessibilityLabel={`${profile.name}'s photo`} />
          <View style={{ flex: 1 }}>
            <Text style={styles.compactName}>
              {profile.name}
              {profile.age ? `, ${profile.age}` : ''}
            </Text>
            {!!place && <Text style={styles.place}>{place}</Text>}
          </View>
        </View>
        {taste}
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View>
        <Image
          source={{ uri: photo }}
          style={[styles.photo, { height: Math.round(Math.max(300, height * 0.46)) }]}
          accessibilityLabel={`${profile.name}'s photo`}
        />
        {/* Bottom gradient keeps the name readable on any photo. */}
        <LinearGradient colors={['rgba(5,7,10,0)', 'rgba(5,7,10,0.85)']} style={styles.photoShade} />
        <View style={styles.photoText}>
          <Text style={styles.name}>
            {profile.name}
            {profile.age ? <Text style={styles.age}>  {profile.age}</Text> : null}
          </Text>
          {!!place && <Text style={styles.placeOnPhoto}>📍 {place}</Text>}
        </View>
      </View>
      {taste}
      {!!profile.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          “{profile.bio}”
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  photo: { width: '100%', backgroundColor: colors.bgElevated },
  photoShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 },
  photoText: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  name: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  age: { color: '#fff', fontSize: 26, fontWeight: '400' },
  placeOnPhoto: { color: 'rgba(255,255,255,0.88)', fontSize: 15, marginTop: 2 },
  taste: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 10 },
  tasteCompact: { paddingHorizontal: 0 },
  matchRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  match: { color: colors.peach, fontSize: 18, fontWeight: '800' },
  common: { color: colors.muted, fontSize: 12 },
  section: { gap: 6 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, maxWidth: '100%' },
  chipLiked: { backgroundColor: 'rgba(110,231,183,0.10)', borderColor: 'rgba(110,231,183,0.35)' },
  chipDisliked: { backgroundColor: 'rgba(251,113,133,0.10)', borderColor: 'rgba(251,113,133,0.35)' },
  chipText: { color: colors.text, fontSize: 13 },
  more: { color: colors.muted, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 13 },
  bio: { color: colors.muted, paddingHorizontal: 16, paddingBottom: 14, fontStyle: 'italic', lineHeight: 20 },
  compactCard: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 },
  compactHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bgElevated },
  compactName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  place: { color: colors.muted, marginTop: 2 }
})
