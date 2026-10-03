import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { EmptyState } from '../../components/EmptyState'
import { SwipeDatingCard } from '../../components/SwipeDatingCard'
import { ReportSheet } from '../../components/ReportSheet'
import { colors } from '../../lib/theme'
import type { DatingProfile } from '../../lib/types'

export default function DatingScreen() {
  const { token } = useAuth()
  const { platform } = usePlatform()
  const [profile, setProfile] = useState<DatingProfile | null>(null)
  const [meta, setMeta] = useState<{ remainingInPool?: number; swipedCount?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [reporting, setReporting] = useState(false)

  const load = useCallback(async () => {
    if (!token || !platform?.datingLaunched) return
    setLoading(true)
    try {
      const data = await apiFetch<{ profile: DatingProfile | null; meta?: { remainingInPool?: number; swipedCount?: number } }>(
        '/dating/deck',
        {},
        token
      )
      setProfile(data.profile)
      setMeta(data.meta || null)
      setMessage('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not load profiles')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [token, platform?.datingLaunched])

  useEffect(() => {
    load().catch(() => null)
  }, [load])

  async function swipe(action: 'like' | 'pass') {
    if (!token || !profile) return
    try {
      const result = await apiFetch<{ matched?: boolean }>('/dating/swipe', { method: 'POST', body: JSON.stringify({ targetId: profile.id, action }) }, token)
      await load()
      if (result.matched) setMessage('It’s a match. Open Matches to say hello.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save swipe')
    }
  }

  if (!platform?.datingLaunched) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Dating opens after launch" body="Watch the Home tab for live male/female counters." emoji="🚀" />
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
        <EmptyState
          title={message || 'No new profiles'}
          body={`You've seen ${meta?.swipedCount ?? 0} profiles. ${meta?.remainingInPool ?? 0} remain in your filtered pool.`}
          emoji="🍿"
        />
        <Pressable style={styles.primaryBtn} onPress={() => load()}>
          <Text style={styles.primaryText}>Refresh deck</Text>
        </Pressable>
        <Pressable
          style={styles.primaryBtn}
          onPress={async () => {
            if (!token) return
            try {
              await apiFetch('/dating/undo', { method: 'POST' }, token)
              await load()
              setMessage('Last swipe undone.')
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'Could not undo')
            }
          }}
        >
          <Text style={styles.primaryText}>Undo last swipe</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <SwipeDatingCard profile={profile} onSwipe={swipe} />
      <Text style={styles.meta}>
        {meta?.remainingInPool ?? 0} left in pool · swipe card or use buttons
      </Text>
      <Pressable onPress={() => setReporting(true)} accessibilityRole="button">
        <Text style={styles.reportText}>Report or block {profile.name}</Text>
      </Pressable>
      <ReportSheet
        visible={reporting}
        userId={profile.id}
        userName={profile.name}
        onClose={() => setReporting(false)}
        onReported={async (blocked) => {
          setReporting(false)
          if (blocked) await load().catch(() => null)
          setMessage(blocked ? 'Thanks for reporting. You won’t see them again.' : 'Thanks — our team will review this profile.')
        }}
      />
      {!!message && <Text style={styles.meta}>{message}</Text>}
      <View style={styles.actions}>
        <Pressable style={styles.passBtn} onPress={() => swipe('pass')}>
          <Text style={styles.passText}>Pass</Text>
        </Pressable>
        <Pressable
          style={styles.passBtn}
          onPress={async () => {
            if (!token) return
            try {
              await apiFetch('/dating/undo', { method: 'POST' }, token)
              await load()
              setMessage('Last swipe undone.')
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'Could not undo')
            }
          }}
        >
          <Text style={styles.passText}>Undo</Text>
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
  meta: { color: colors.muted, textAlign: 'center', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  passBtn: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center' },
  passText: { color: colors.text, fontWeight: '700' },
  likeBtn: { flex: 1, borderRadius: 999, backgroundColor: colors.pink, paddingVertical: 14, alignItems: 'center' },
  likeText: { color: '#fff', fontWeight: '800' },
  primaryBtn: { alignSelf: 'center', backgroundColor: colors.purple, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  primaryText: { color: '#fff', fontWeight: '700' },
  reportText: { color: colors.muted, textAlign: 'center', fontSize: 12, textDecorationLine: 'underline' }
})
