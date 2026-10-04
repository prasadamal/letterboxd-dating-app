import { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../lib/api'
import { colors } from '../lib/theme'
import type { Friend } from '../lib/types'

// Film friends: compare taste with anyone — works before dating opens and for people you'd never date.
export default function FriendsScreen() {
  const router = useRouter()
  const [friends, setFriends] = useState<Friend[]>([])
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

  useEffect(() => {
    load()
  }, [load])

  async function add() {
    if (!code.trim()) return
    setAdding(true)
    setError('')
    try {
      await apiFetch('/friends', { method: 'POST', body: JSON.stringify({ code: code.trim() }) })
      setCode('')
      await load()
    } catch (err) {
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
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <Text style={styles.heading}>Film friends</Text>
      <Text style={styles.sub}>
        See how your taste matches with friends, family or anyone — and get ideas for what to watch together.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>YOUR FRIEND CODE</Text>
        <Text style={styles.code} selectable>
          {myCode || '…'}
        </Text>
        <Pressable
          style={styles.primary}
          disabled={!myCode}
          onPress={() => Share.share({ message: `Compare our film taste on ReelMates — add me with code ${myCode}` })}
        >
          <Text style={styles.primaryText}>Share my code</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ADD A FRIEND</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Their code, e.g. REEL1A2B3C"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Pressable style={[styles.primary, styles.addBtn, (!code.trim() || adding) && { opacity: 0.5 }]} disabled={!code.trim() || adding} onPress={add}>
            <Text style={styles.primaryText}>Add</Text>
          </Pressable>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      {friends.length === 0 ? (
        <Text style={styles.sub}>No film friends yet. Share your code to get started.</Text>
      ) : (
        friends.map((friend) => (
          <Pressable
            key={friend.id}
            style={styles.friend}
            onPress={() => router.push({ pathname: '/compare/[userId]', params: { userId: friend.id, name: friend.name } })}
            onLongPress={() => remove(friend)}
          >
            <Image source={{ uri: friend.photo_url || friend.avatar_url }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{friend.name}</Text>
              <Text style={styles.meta}>
                {friend.sharedCount ? `${friend.sharedCount} films in common` : 'No films in common yet'}
                {friend.favorite ? ` · ❤ ${friend.favorite.title}` : ''}
              </Text>
            </View>
            <Text style={styles.score}>{friend.score}%</Text>
          </Pressable>
        ))
      )}
      {friends.length > 0 && <Text style={styles.hint}>Tap a friend to compare. Long-press to remove.</Text>}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heading: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.muted, lineHeight: 20 },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
  label: { color: colors.peach, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  code: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  primary: { backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8 },
  addBtn: { paddingHorizontal: 22 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, color: colors.text },
  error: { color: colors.error },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgElevated },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  score: { color: colors.peach, fontSize: 20, fontWeight: '800' }
})
