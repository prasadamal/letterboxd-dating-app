import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState, type ReactNode } from 'react'
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { colors, fonts, radii, type } from '../lib/theme'
import type { DatingProfile } from '../lib/types'
import { Avatar, MatchPill, PersonalityBadge, Tag } from './ui'

type Props = {
  profile: Pick<
    DatingProfile,
    | 'name'
    | 'age'
    | 'country'
    | 'city'
    | 'bio'
    | 'avatar_url'
    | 'photo_url'
    | 'score'
    | 'sharedCount'
    | 'sharedLoved'
    | 'sharedHated'
    | 'favorite'
    | 'prompts'
    | 'personality'
    | 'verification_status'
  >
  compact?: boolean
  // Deck buttons, drawn on the photo's bottom edge so they never cover the details.
  actions?: ReactNode
}

const FAVORITE_NOTE = {
  same: { text: 'Same as yours!', tone: 'lime' as const },
  you_liked: { text: 'You liked it too', tone: 'green' as const },
  you_disliked: { text: "You didn't like it", tone: 'red' as const },
  not_rated: null
}

function placeOf(profile: Props['profile']) {
  return [profile.city, profile.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')
}

function FilmTags({ titles, tone, max }: { titles: string[]; tone: 'pink' | 'red'; max: number }) {
  const shown = titles.slice(0, max)
  const more = titles.length - shown.length
  return (
    <View style={styles.tags}>
      {shown.map((title) => (
        <Tag key={title} label={title} tone={tone} icon={tone === 'pink' ? 'heart' : 'close'} />
      ))}
      {more > 0 && <Text style={styles.more}>+{more} more</Text>}
    </View>
  )
}

// Why you two match: films in common first, then the favourite, then their own words.
function TasteDetails({ profile, compact, actions }: Props) {
  const loved = profile.sharedLoved || []
  const hated = profile.sharedHated || []
  const common = profile.sharedCount ?? loved.length + hated.length
  const note = profile.favorite ? FAVORITE_NOTE[profile.favorite.relation] : null
  const max = compact ? 2 : 6
  return (
    <View style={[styles.details, compact && styles.detailsCompact, Boolean(actions) && { paddingTop: 52 }]}>
      <Text style={type.label}>{common ? `${common} films in common` : 'No films in common yet'}</Text>
      {loved.length > 0 && <FilmTags titles={loved} tone="pink" max={max} />}
      {hated.length > 0 && <FilmTags titles={hated} tone="red" max={compact ? 1 : 4} />}
      {profile.favorite && (
        <View style={styles.favorite}>
          <Text style={styles.favoriteLabel}>ALL-TIME FAVOURITE</Text>
          <Text style={styles.favoriteTitle} numberOfLines={2}>
            {profile.favorite.title}
          </Text>
          {note && <Tag label={note.text} tone={note.tone} />}
        </View>
      )}
      {!compact &&
        (profile.prompts || []).map((prompt) => (
          <View key={prompt.key} style={styles.prompt}>
            <Text style={styles.promptQuestion}>{prompt.question}</Text>
            <Text style={styles.promptAnswer}>{prompt.answer}</Text>
          </View>
        ))}
      {!compact && !!profile.bio && <Text style={styles.bio}>“{profile.bio}”</Text>}
      {!compact && !loved.length && !hated.length && (
        <Text style={type.small}>Keep playing the daily films. Shared favourites show up here.</Text>
      )}
    </View>
  )
}

export function TasteProfileCard({ profile, compact = false, actions }: Props) {
  const { height } = useWindowDimensions()
  const place = placeOf(profile)

  if (compact) {
    return (
      <View style={styles.compact}>
        <View style={styles.compactHead}>
          <Avatar uri={profile.photo_url} name={profile.name} size={56} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.h3}>
              {profile.name}
              {profile.age ? `, ${profile.age}` : ''}
            </Text>
            {!!place && <Text style={type.small}>{place}</Text>}
          </View>
          <MatchPill score={profile.score} size="sm" />
        </View>
        <PersonalityBadge personality={profile.personality} size="sm" />
        <TasteDetails profile={profile} compact />
      </View>
    )
  }

  const photoHeight = Math.round(Math.max(340, height * 0.56))
  return (
    <View style={styles.card}>
      <View style={{ height: photoHeight, zIndex: 2 }}>
        <PhotoFill uri={profile.photo_url} name={profile.name} />
        <LinearGradient colors={['rgba(8,8,11,0)', 'rgba(8,8,11,0.25)', 'rgba(8,8,11,0.92)']} locations={[0.35, 0.6, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.topRow}>
          <MatchPill score={profile.score} size="lg" />
          {profile.verification_status === 'verified' && (
            <View style={styles.verified}>
              <Ionicons name="checkmark-circle" size={16} color={colors.cyan} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <View style={[styles.photoText, Boolean(actions) && { bottom: 50 }]}>
          <PersonalityBadge personality={profile.personality} />
          <Text style={styles.name} numberOfLines={1}>
            {profile.name}
            {profile.age ? <Text style={styles.age}>  {profile.age}</Text> : null}
          </Text>
          {!!place && (
            <View style={styles.placeRow}>
              <Ionicons name="location-sharp" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.place}>{place}</Text>
            </View>
          )}
        </View>
        {actions && <View style={styles.actions}>{actions}</View>}
      </View>
      <TasteDetails profile={profile} actions={actions} />
    </View>
  )
}

// Full-bleed photo, or a big gradient monogram when there is none (or it fails to load).
function PhotoFill({ uri, name }: { uri?: string | null; name: string }) {
  const [failed, setFailed] = useState(false)
  if (uri && !failed) {
    return <Image source={{ uri }} onError={() => setFailed(true)} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`${name}'s photo`} />
  }
  return (
    <LinearGradient colors={['#8B6CFF', '#FF4F9A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.monogram]}>
      <Text style={styles.monogramText}>{name.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  topRow: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(8,8,11,0.6)', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedText: { fontFamily: fonts.semi, color: colors.text, fontSize: 12 },
  photoText: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 8 },
  name: { fontFamily: fonts.display, color: '#fff', fontSize: 38, lineHeight: 42, letterSpacing: -1.2 },
  age: { fontFamily: fonts.medium, color: 'rgba(255,255,255,0.9)', fontSize: 30 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -4 },
  place: { color: 'rgba(255,255,255,0.88)', fontSize: 15 },
  monogram: { alignItems: 'center', justifyContent: 'center' },
  actions: { position: 'absolute', left: 0, right: 0, bottom: -34, flexDirection: 'row', justifyContent: 'center', gap: 36, zIndex: 10, elevation: 10 },
  monogramText: { fontFamily: fonts.display, color: 'rgba(255,255,255,0.9)', fontSize: 140 },
  details: { padding: 18, gap: 12 },
  detailsCompact: { padding: 0, gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  more: { color: colors.muted, fontSize: 12 },
  favorite: { backgroundColor: colors.cardHigh, borderRadius: radii.md, padding: 14, gap: 6 },
  favoriteLabel: { fontFamily: fonts.semi, color: colors.pink, fontSize: 11, letterSpacing: 1.4 },
  favoriteTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 18 },
  prompt: { backgroundColor: colors.cardHigh, borderRadius: radii.md, padding: 16, gap: 6 },
  promptQuestion: { fontFamily: fonts.semi, color: colors.lime, fontSize: 13 },
  promptAnswer: { fontFamily: fonts.display, color: colors.text, fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },
  bio: { color: colors.soft, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  compact: { gap: 10 },
  compactHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }
})
