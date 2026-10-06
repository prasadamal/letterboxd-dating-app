import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { Avatar, Button, Card, EmptyState, MatchPill, PersonalityBadge, SectionTitle } from '../components/ui'
import { apiFetch } from '../lib/api'
import { haptic } from '../lib/haptics'
import { WEB_URL } from '../lib/profileOptions'
import { colors, fonts, radii, type } from '../lib/theme'
import type { Friend } from '../lib/types'

// Film friends: compare taste with anyone (friends, family, people you'd never date). Works before dating opens.
export default function FriendsScreen() {
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [myCode, setMyCode] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ friends: Friend[]; myCode: string }>('/friends')
      setFriends(data.friends || [])
      setMyCode(data.myCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load friends')
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function add() {
    if (!code.trim()) return
    setAdding(true)
    setError('')
    try {
      await apiFetch('/friends', { method: 'POST', body: JSON.stringify({ code: code.trim() }) })
      setCode('')
      haptic.success()
      await load()
    } catch (err) {
      haptic.warning()
      setError(err instanceof Error ? err.message : 'Could not add friend')
    } finally {
      setAdding(false)
    }
  }

  function remove(friend: Friend) {
    Alert.alert(`Remove ${friend.name}?`, 'You will no longer see each other in Film friends.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await apiFetch(`/friends/${friend.id}`, { method: 'DELETE' }).catch(() => null)
          await load()
        }
      }
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.codeCard}>
        <Text style={type.label}>Your friend code</Text>
        <Text style={styles.code} selectable>
          {myCode || '········'}
        </Text>
        <Text style={type.small}>Friends add you with it and instantly see your taste match.</Text>
        <Button
          title="Share my code"
          icon="share-social"
          disabled={!myCode}
          onPress={() => Share.share({ message: `Add me on ReelMates with code ${myCode} and see how our film taste matches 🎬 ${WEB_URL}` }).catch(() => null)}
        />
      </Card>

      <SectionTitle title="Add a friend" />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Their code, e.g. REEL1A2B3C"
          placeholderTextColor={colors.faint}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Button title="Add" size="md" loading={adding} disabled={!code.trim()} onPress={add} />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <SectionTitle title={friends?.length ? `Your film people · ${friends.length}` : 'Your film people'} />
      {friends && friends.length === 0 && (
        <EmptyState emoji="👯" title="No film friends yet" body="Share your code, or add someone's. You'll see your match %, both favourites and films to watch together." />
      )}
      {(friends || []).map((friend) => (
        <Pressable
          key={friend.id}
          style={({ pressed }) => [styles.friend, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: '/compare/[userId]', params: { userId: friend.id, name: friend.name } })}
          onLongPress={() => remove(friend)}
          accessibilityRole="button"
          accessibilityLabel={`${friend.name}, ${friend.score}% match. Long press to remove.`}
        >
          <Avatar uri={friend.photo_url} name={friend.name} size={54} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name}>{friend.name}</Text>
            <PersonalityBadge personality={friend.personality} size="sm" />
            <Text style={type.small}>
              {friend.sharedCount ? `${friend.sharedCount} films in common` : 'No films in common yet'}
              {friend.favorite ? ` · ❤ ${friend.favorite.title}` : ''}
            </Text>
          </View>
          <MatchPill score={friend.score} size="sm" />
        </Pressable>
      ))}
      {!!friends?.length && <Text style={styles.hint}>Tap to compare · long-press to remove</Text>}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  codeCard: { padding: 20, gap: 10, borderColor: 'rgba(212,255,63,0.35)' },
  code: { fontFamily: fonts.display, color: colors.lime, fontSize: 38, letterSpacing: 3 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, color: colors.text, paddingHorizontal: 18, paddingVertical: 13, fontSize: 16 },
  error: { color: colors.red },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 12 },
  name: { fontFamily: fonts.bold, color: colors.text, fontSize: 16 },
  hint: { color: colors.faint, fontSize: 12, textAlign: 'center' }
})
