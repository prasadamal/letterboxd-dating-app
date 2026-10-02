import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { colors } from '../../lib/theme'
import type { DatingProfile } from '../../lib/types'

export default function DatingScreen() {
  const { token } = useAuth()
  const { platform } = usePlatform()
  const [profile, setProfile] = useState<DatingProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!token || !platform?.datingLaunched) return
    setLoading(true)
    try {
      const data = await apiFetch<{ profile: DatingProfile | null }>('/dating/deck', {}, token)
      setProfile(data.profile)
      setMessage('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not load profiles')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [token, platform?.datingLaunched])

  useEffect(() => {
    load().catch(console.error)
  }, [load])

  async function swipe(action: 'like' | 'pass') {
    if (!token || !profile) return
    await apiFetch('/dating/swipe', { method: 'POST', body: JSON.stringify({ targetId: profile.id, action }) }, token)
    await load()
  }

  if (!platform?.datingLaunched) {
    return (
      <View style={styles.screen}>
        <Text style={styles.lockedTitle}>Dating opens after launch</Text>
        <Text style={styles.lockedBody}>Check the Home tab for live male/female counters.</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.screen}>
        <Text style={styles.lockedTitle}>{message || 'No new profiles right now'}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => load()}>
          <Text style={styles.primaryText}>Refresh</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Image source={{ uri: profile.avatar_url }} style={styles.photo} />
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>
        <Text style={styles.sub}>{profile.country || profile.city}</Text>
        <Text style={styles.bio}>{profile.bio}</Text>
        {!!profile.likedLine && <Text style={styles.tasteGood}>{profile.likedLine}</Text>}
        {!!profile.dislikedLine && <Text style={styles.tasteBad}>{profile.dislikedLine}</Text>}
        <Text style={styles.score}>{Math.round(profile.score)}% taste match</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.passBtn} onPress={() => swipe('pass')}>
          <Text style={styles.passText}>Pass</Text>
        </Pressable>
        <Pressable style={styles.likeBtn} onPress={() => swipe('like')}>
          <Text style={styles.likeText}>Like</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16, justifyContent: 'center', gap: 16 },
  lockedTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  lockedBody: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
  photo: { width: '100%', height: 280, borderRadius: 18, backgroundColor: colors.border },
  name: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.muted },
  bio: { color: colors.soft, lineHeight: 21 },
  tasteGood: { color: colors.green, lineHeight: 20 },
  tasteBad: { color: colors.error, lineHeight: 20 },
  score: { color: colors.peach, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  passBtn: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center' },
  passText: { color: colors.text, fontWeight: '700' },
  likeBtn: { flex: 1, borderRadius: 999, backgroundColor: colors.pink, paddingVertical: 14, alignItems: 'center' },
  likeText: { color: '#fff', fontWeight: '800' },
  primaryBtn: { alignSelf: 'center', backgroundColor: colors.purple, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  primaryText: { color: '#fff', fontWeight: '700' }
})
