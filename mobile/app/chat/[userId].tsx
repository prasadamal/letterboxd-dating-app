import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { subscribeChatChannel } from '../../lib/realtime'
import { colors } from '../../lib/theme'
import type { ChatMessage } from '../../lib/types'

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [introPending, setIntroPending] = useState(false)
  const [chatUnlocked, setChatUnlocked] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<string | null>(null)
  const lastSyncRef = useRef<string | null>(null)

  const mergeMessage = useCallback((msg: ChatMessage) => {
    setMessages((current) => {
      if (current.some((m) => String(m.id) === String(msg.id))) {
        return current.map((m) => (String(m.id) === String(msg.id) ? { ...m, ...msg } : m))
      }
      return [...current, msg].sort((a, b) => a.created_at.localeCompare(b.created_at))
    })
    lastSyncRef.current = msg.created_at
  }, [])

  const loadMessages = useCallback(
    async (since?: string | null) => {
      if (!token || !userId) return
      const query = since ? `?since=${encodeURIComponent(since)}` : ''
      const data = await apiFetch<{
        messages: ChatMessage[]
        introPending?: boolean
        chatUnlocked?: boolean
        realtimeChannel?: string
      }>(`/messages/${userId}${query}`, {}, token)

      if (data.realtimeChannel) setRealtimeChannel(data.realtimeChannel)

      if (since && data.messages?.length) {
        for (const msg of data.messages) mergeMessage(msg)
      } else if (!since) {
        setMessages(data.messages || [])
        const latest = data.messages?.[data.messages.length - 1]?.created_at
        if (latest) lastSyncRef.current = latest
      }

      setIntroPending(Boolean(data.introPending))
      setChatUnlocked(Boolean(data.chatUnlocked))
      await apiFetch(`/messages/${userId}/read`, { method: 'POST' }, token).catch(() => null)
    },
    [token, userId, mergeMessage]
  )

  useEffect(() => {
    loadMessages().catch(console.error)
    const intervalMs = realtimeChannel ? 20000 : 5000
    const timer = setInterval(() => {
      loadMessages(lastSyncRef.current).catch(console.error)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [loadMessages, realtimeChannel])

  useEffect(() => {
    if (!realtimeChannel) return
    return subscribeChatChannel(realtimeChannel, {
      onMessage: (payload) => {
        const msg = payload as ChatMessage
        if (msg?.id) mergeMessage(msg)
      },
      onRead: () => {
        loadMessages(lastSyncRef.current).catch(console.error)
      }
    })
  }, [realtimeChannel, mergeMessage, loadMessages])

  async function send() {
    if (!token || !userId || !text.trim()) return
    try {
      const data = await apiFetch<{ message: ChatMessage }>(
        '/messages',
        { method: 'POST', body: JSON.stringify({ toUserId: userId, text }) },
        token
      )
      mergeMessage(data.message)
      setText('')
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
      {realtimeChannel ? <Text style={styles.live}>Live chat connected</Text> : null}
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
  live: { color: colors.green, paddingHorizontal: 16, fontSize: 11, letterSpacing: 0.5 },
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
