import { Image, StyleSheet, Text, View } from 'react-native'
import { colors, radii, typography } from '../lib/theme'
import type { DatingProfile } from '../lib/types'

type Props = {
  profile: Pick<
    DatingProfile,
    'name' | 'age' | 'country' | 'city' | 'bio' | 'avatar_url' | 'score' | 'likedLine' | 'dislikedLine' | 'loved' | 'hated'
  >
  compact?: boolean
}

export function TasteProfileCard({ profile, compact = false }: Props) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
      {!compact && <Image source={{ uri: profile.avatar_url }} style={styles.photo} />}
      <Text style={styles.name}>
        {profile.name}, {profile.age}
      </Text>
      <Text style={styles.sub}>{profile.country || profile.city}</Text>
      {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      {!!profile.likedLine && <Text style={styles.good}>{profile.likedLine}</Text>}
      {!!profile.dislikedLine && <Text style={styles.bad}>{profile.dislikedLine}</Text>}
      <Text style={styles.score}>{Math.round(profile.score)}% taste match</Text>
      {!compact && (
        <View style={styles.lists}>
          <View style={styles.listCol}>
            <Text style={styles.listLabel}>Loved</Text>
            {(profile.loved || []).slice(0, 2).map((m) => (
              <Text key={m} style={styles.listItem}>
                {m}
              </Text>
            ))}
          </View>
          <View style={styles.listCol}>
            <Text style={styles.listLabel}>Not for them</Text>
            {(profile.hated || []).slice(0, 2).map((m) => (
              <Text key={m} style={styles.listItem}>
                {m}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardGlass,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8
  },
  compact: { padding: 12 },
  photo: { width: '100%', height: 280, borderRadius: radii.md, backgroundColor: colors.border },
  name: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.muted },
  bio: { color: colors.soft, lineHeight: 21 },
  good: { color: colors.green, lineHeight: 20 },
  bad: { color: colors.error, lineHeight: 20 },
  score: { color: colors.peach, fontWeight: '700', marginTop: 4 },
  lists: { flexDirection: 'row', gap: 12, marginTop: 8 },
  listCol: { flex: 1, gap: 4 },
  listLabel: { color: colors.muted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  listItem: { color: colors.soft, fontSize: 12, lineHeight: 16 }
})
