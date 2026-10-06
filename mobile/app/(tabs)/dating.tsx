import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MatchOverlay } from '../../components/MatchOverlay'
import { ReportSheet } from '../../components/ReportSheet'
import { SwipeDatingCard } from '../../components/SwipeDatingCard'
import { Button, Card, EmptyState, IconButton, ProgressBar, ScreenHeader } from '../../components/ui'
import { ApiError, apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { haptic } from '../../lib/haptics'
import { usePlatform } from '../../lib/platform'
import { WEB_URL } from '../../lib/profileOptions'
import { colors, fonts, radii, type } from '../../lib/theme'
import type { DatingProfile } from '../../lib/types'

type DeckMeta = { remainingInPool?: number; swipedCount?: number; regionOnly?: boolean }

export default function MatchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, refreshUser } = useAuth()
  const { platform } = usePlatform()
  const [profile, setProfile] = useState<DatingProfile | null>(null)
  const [meta, setMeta] = useState<DeckMeta | null>(null)
  const [blocker, setBlocker] = useState<'incomplete' | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [reporting, setReporting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [match, setMatch] = useState<DatingProfile | null>(null)

  const datingOn = user?.dating_enabled !== false
  const open = Boolean(platform?.datingLaunched)

  const load = useCallback(async () => {
    if (!datingOn || !open) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<{ profile: DatingProfile | null; meta?: DeckMeta }>('/dating/deck')
      setProfile(data.profile)
      setMeta(data.meta || null)
      setBlocker(null)
      setMessage('')
    } catch (err) {
      setProfile(null)
      if (err instanceof ApiError && err.code === 'PROFILE_INCOMPLETE') setBlocker('incomplete')
      else setMessage(err instanceof Error ? err.message : 'Could not load profiles')
    } finally {
      setLoading(false)
    }
  }, [datingOn, open])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function swipe(action: 'like' | 'pass') {
    if (!profile) return
    const current = profile
    try {
      const result = await apiFetch<{ matched?: boolean }>('/dating/swipe', {
        method: 'POST',
        body: JSON.stringify({ targetId: current.id, action })
      })
      if (result.matched) {
        haptic.success()
        setMatch(current)
      }
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save that')
    }
  }

  async function undo() {
    try {
      await apiFetch('/dating/undo', { method: 'POST' })
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Nothing to undo')
    }
  }

  async function turnOnDating() {
    if (!user?.gender) {
      router.push('/settings')
      return
    }
    try {
      await apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify({ datingEnabled: true }) })
      await refreshUser()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not turn on dating')
    }
  }

  const header = (
    <ScreenHeader
      title="Match"
      subtitle={
        open && datingOn && meta
          ? `${meta.remainingInPool ?? 0} ${meta.remainingInPool === 1 ? 'person' : 'people'} in your deck${platform?.regionOnly && platform.country ? ` · ${platform.country.name}` : ''}`
          : 'Dates ranked by film taste'
      }
      right={
        open && datingOn ? (
          <View style={styles.headerActions}>
            <IconButton icon="arrow-undo" size={40} accessibilityLabel="Undo last swipe" onPress={undo} />
            <IconButton icon="options-outline" size={40} accessibilityLabel="Dating preferences" onPress={() => router.push('/settings')} />
          </View>
        ) : undefined
      }
    />
  )

  if (!datingOn) {
    return (
      <View style={styles.screen}>
        {header}
        <EmptyState emoji="🍿" title="Dating is off" body="You're here for films and friends. Turn dating on anytime to get a deck ranked by taste match.">
          <Button title="Turn on dating" icon="heart" onPress={turnOnDating} style={styles.cta} />
          {!!message && <Text style={styles.error}>{message}</Text>}
        </EmptyState>
      </View>
    )
  }

  if (!open) {
    const country = platform?.country
    const pct = country?.progressPercent ?? platform?.progressPercent ?? 0
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        {header}
        <View style={styles.body}>
          <Card style={styles.lockedCard}>
            <Text style={styles.bigEmoji}>🎟️</Text>
            <Text style={type.h2}>{country ? `Dating opens in ${country.name} soon` : 'Dating opens soon'}</Text>
            <Text style={type.body}>
              We open each country once enough people of each gender have joined, so your first deck is full of people with your taste.
            </Text>
            <ProgressBar value={pct} height={10} />
            <Text style={styles.pct}>{pct}% there</Text>
            <Button
              title="Invite friends to open it sooner"
              icon="paper-plane"
              onPress={() =>
                Share.share({ message: `Join me on ReelMates, where people match by film taste 🎬 ${WEB_URL}` }).catch(() => null)
              }
            />
          </Card>
          <Text style={type.label}>Meanwhile</Text>
          <Card onPress={() => router.push('/(tabs)/home')}>
            <Text style={type.h3}>🎬 Play today's films</Text>
            <Text style={type.small}>Every swipe sharpens your matches for launch day.</Text>
          </Card>
          <Card onPress={() => router.push('/friends')}>
            <Text style={type.h3}>👯 Compare taste with friends</Text>
            <Text style={type.small}>See your match % with anyone, no dating needed.</Text>
          </Card>
        </View>
      </ScrollView>
    )
  }

  if (loading && !profile) {
    return (
      <View style={styles.screen}>
        {header}
        <ActivityIndicator color={colors.lime} size="large" style={{ marginTop: 80 }} />
      </View>
    )
  }

  if (blocker === 'incomplete') {
    return (
      <View style={styles.screen}>
        {header}
        <EmptyState emoji="📸" title="Add a photo to start matching" body="Your taste gets you in the door; a photo lets people say yes. It takes 10 seconds.">
          <Button title="Add a photo" icon="camera" onPress={() => router.push('/edit-profile')} style={styles.cta} />
        </EmptyState>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView scrollEnabled={!dragging} contentContainerStyle={{ paddingBottom: 40 }}>
        {header}
        <View style={styles.body}>
          {profile ? (
            <>
              <SwipeDatingCard
                key={profile.id}
                profile={profile}
                onSwipe={swipe}
                onDragChange={setDragging}
                actions={
                  <>
                    <IconButton icon="close" size={68} color={colors.red} background={colors.card} accessibilityLabel={`Pass on ${profile.name}`} onPress={() => swipe('pass')} />
                    <IconButton icon="heart" size={68} color="#fff" background={colors.pink} border={colors.pink} accessibilityLabel={`Like ${profile.name}`} onPress={() => swipe('like')} />
                  </>
                }
              />
              <Pressable onPress={() => setReporting(true)} accessibilityRole="button" style={styles.reportBtn}>
                <Text style={styles.reportText}>Report or block {profile.name}</Text>
              </Pressable>
            </>
          ) : (
            <EmptyState emoji="🍿" title="That's everyone for now" body={message || 'New people join every day. Play today\'s films while you wait: more ratings, better matches.'}>
              <Button title="Refresh" variant="secondary" icon="refresh" onPress={load} style={styles.cta} />
              <Button title="Undo last swipe" variant="ghost" onPress={undo} />
            </EmptyState>
          )}
          {!!message && profile && <Text style={styles.error}>{message}</Text>}
        </View>
      </ScrollView>

      {profile && (
        <ReportSheet
          visible={reporting}
          userId={profile.id}
          userName={profile.name}
          onClose={() => setReporting(false)}
          onReported={async (blocked) => {
            setReporting(false)
            if (blocked) await load()
            setMessage(blocked ? "Thanks for reporting. You won't see them again." : 'Thanks. Our team will review this profile.')
          }}
        />
      )}

      <MatchOverlay
        match={match}
        me={user ? { name: user.name, photo_url: user.photo_url } : null}
        onClose={() => setMatch(null)}
        onChat={() => {
          const peer = match
          setMatch(null)
          if (peer) router.push({ pathname: '/chat/[userId]', params: { userId: peer.id, name: peer.name } })
        }}
      />
      <View style={{ height: insets.bottom }} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 16, gap: 14 },
  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  cta: { alignSelf: 'stretch', marginTop: 8 },
  lockedCard: { alignItems: 'flex-start', gap: 12, padding: 20, borderRadius: radii.xl },
  bigEmoji: { fontSize: 44 },
  pct: { fontFamily: fonts.bold, color: colors.lime, fontSize: 15, marginTop: -4 },
  reportBtn: { alignSelf: 'center', padding: 8 },
  reportText: { color: colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  error: { color: colors.red, textAlign: 'center' }
})
