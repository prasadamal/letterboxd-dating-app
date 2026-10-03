import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'
import type { ChatMessage } from '../../lib/types'

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [introPending, setIntroPending] = useState(false)
  const [chatUnlocked, setChatUnlocked] = useState(true)
  const lastSyncRef = useRef<string | null>(null)

  const loadMessages = useCallback(
    async (since?: string | null) => {
      if (!token || !userId) return
      const query = since ? `?since=${encodeURIComponent(since)}` : ''
      const data = await apiFetch<{ messages: ChatMessage[]; introPending?: boolean; chatUnlocked?: boolean }>(
        `/messages/${userId}${query}`,
        {},
        token
      )
      if (since && data.messages?.length) {
        setMessages((current) => {
          const known = new Set(current.map((m) => String(m.id)))
          const merged = [...current]
          for (const msg of data.messages) {
            if (!known.has(String(msg.id))) merged.push(msg)
          }
          return merged.sort((a, b) => a.created_at.localeCompare(b.created_at))
        })
      } else if (!since) {
        setMessages(data.messages || [])
      }
      setIntroPending(Boolean(data.introPending))
      setChatUnlocked(Boolean(data.chatUnlocked))
      const latest = data.messages?.[data.messages.length - 1]?.created_at
      if (latest) lastSyncRef.current = latest
      await apiFetch(`/messages/${userId}/read`, { method: 'POST' }, token).catch(() => null)
    },
    [token, userId]
  )

  useEffect(() => {
    loadMessages().catch(console.error)
    const timer = setInterval(() => {
      loadMessages(lastSyncRef.current).catch(console.error)
    }, 4000)
    return () => clearInterval(timer)
  }, [loadMessages])

  async function send() {
    if (!token || !userId || !text.trim()) return
    try {
      const data = await apiFetch<{ message: ChatMessage }>(
        '/messages',
        { method: 'POST', body: JSON.stringify({ toUserId: userId, text }) },
        token
      )
      setMessages((current) => [...current, data.message])
      setText('')
      lastSyncRef.current = data.message.created_at
      if (introPending) {
        setIntroPending(false)
        setChatUnlocked(true)
      }
    } catch (err) {
      Alert.alert('Message not sent', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function reportUser() {
    await apiFetch(
      '/safety/report',
      { method: 'POST', body: JSON.stringify({ userId, reason: 'inappropriate', details: 'Reported from chat' }) },
      token
    )
    Alert.alert('Report submitted', 'Our team will review this profile.')
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {introPending && !chatUnlocked && (
        <Text style={styles.banner}>Send one hello — chat unlocks after you both message once.</Text>
      )}
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const mine = item.from_user_id === user?.id
          return (
            <View style={[styles.bubble, mine && styles.mine]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
              {mine && item.read_at ? <Text style={styles.readReceipt}>Read</Text> : null}
            </View>
          )
        }}
      />
      <View style={styles.composer}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Say hello…" placeholderTextColor={colors.muted} />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
      <Pressable style={styles.reportBtn} onPress={reportUser}>
        <Text style={styles.reportText}>Report user</Text>
      </Pressable>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  banner: { color: colors.peach, paddingHorizontal: 16, paddingTop: 8, fontSize: 12 },
  bubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border, maxWidth: '85%' },
  mine: { alignSelf: 'flex-end', backgroundColor: 'rgba(173,124,255,0.15)' },
  bubbleText: { color: colors.text },
  readReceipt: { color: colors.muted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.card },
  sendBtn: { backgroundColor: colors.pink, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
  reportBtn: { paddingBottom: 12, alignItems: 'center' },
  reportText: { color: colors.muted, fontSize: 12, textDecorationLine: 'underline' }
})
