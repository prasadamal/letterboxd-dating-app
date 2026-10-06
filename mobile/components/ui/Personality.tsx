import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import type { Personality, PersonalityBadgeData } from '../../lib/types'
import { colors, fonts, radii, type } from '../../lib/theme'

// Small gradient pill: "🪔 Desi Cinephile".
export function PersonalityBadge({ personality, size = 'md' }: { personality?: PersonalityBadgeData | null; size?: 'sm' | 'md' }) {
  if (!personality) return null
  return (
    <LinearGradient
      colors={personality.colors as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, size === 'sm' && styles.badgeSm]}
    >
      <Text style={[styles.badgeText, size === 'sm' && styles.badgeTextSm]} numberOfLines={1}>
        {personality.emoji} {personality.name}
      </Text>
    </LinearGradient>
  )
}

// The full personality reveal: big emoji, name, tagline and trait chips.
export function PersonalityCard({ personality }: { personality: Personality }) {
  if (!personality.ready) {
    const rated = personality.progress?.rated ?? 0
    const needed = personality.progress?.needed ?? 8
    return (
      <View style={styles.locked}>
        <Text style={styles.lockedEmoji}>🔮</Text>
        <Text style={type.h3}>Your film personality</Text>
        <Text style={[type.small, { textAlign: 'center' }]}>
          Like or pass {Math.max(0, needed - rated)} more {needed - rated === 1 ? 'film' : 'films'} to reveal it.
        </Text>
        <View style={styles.dots}>
          {Array.from({ length: needed }, (_, i) => (
            <View key={i} style={[styles.dot, i < rated && styles.dotOn]} />
          ))}
        </View>
      </View>
    )
  }
  return (
    <LinearGradient colors={personality.colors as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text style={styles.kicker}>MY FILM PERSONALITY</Text>
      <Text style={styles.emoji}>{personality.emoji}</Text>
      <Text style={styles.name}>{personality.name}</Text>
      <Text style={styles.tagline}>{personality.tagline}</Text>
      {personality.traits.length > 0 && (
        <View style={styles.traits}>
          {personality.traits.map((trait) => (
            <View key={trait} style={styles.trait}>
              <Text style={styles.traitText}>{trait}</Text>
            </View>
          ))}
        </View>
      )}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  badge: { borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', maxWidth: '100%' },
  badgeSm: { paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.bold, color: '#fff', fontSize: 13 },
  badgeTextSm: { fontSize: 11 },
  card: { borderRadius: radii.xl, padding: 22, gap: 6, overflow: 'hidden' },
  kicker: { fontFamily: fonts.semi, color: 'rgba(255,255,255,0.75)', fontSize: 11, letterSpacing: 2 },
  emoji: { fontSize: 54, marginTop: 6 },
  name: { fontFamily: fonts.display, color: '#fff', fontSize: 32, lineHeight: 34, letterSpacing: -1 },
  tagline: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 21 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  trait: { backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 5 },
  traitText: { fontFamily: fonts.semi, color: '#fff', fontSize: 12 },
  locked: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', padding: 22, alignItems: 'center', gap: 6 },
  lockedEmoji: { fontSize: 40 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dot: { width: 18, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  dotOn: { backgroundColor: colors.lime }
})
