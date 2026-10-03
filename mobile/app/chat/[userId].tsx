import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { ApiError, apiFetch } from '../../lib/api'
import { ReportSheet } from '../../components/ReportSheet'
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
  const [waitingOnPeer, setWaitingOnPeer] = useState(false)
  const [chatUnlocked, setChatUnlocked] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const [reporting, setReporting] = useState(false)
  const lastSyncRef = useRef<string | null>(null)
  const router = useRouter()

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
      if (!token || !userId || closed) return
      const query = since ? `?since=${encodeURIComponent(since)}` : ''
      let data: {
        messages: ChatMessage[]
        introPending?: boolean
        waitingOnPeer?: boolean
        chatUnlocked?: boolean
        realtimeChannel?: string
      }
      try {
        data = await apiFetch<{
        messages: ChatMessage[]
        introPending?: boolean
        waitingOnPeer?: boolean
        chatUnlocked?: boolean
        realtimeChannel?: string
      }>(`/messages/${userId}${query}`, {}, token)
      } catch (err) {
        // 404: the match ended (blocked, unmatched or account deleted). Stop polling.
        if (err instanceof ApiError && err.status === 404) {
          setClosed(true)
          return
        }
        throw err
      }

      if (data.realtimeChannel) setRealtimeChannel(data.realtimeChannel)

      if (since && data.messages?.length) {
        for (const msg of data.messages) mergeMessage(msg)
      } else if (!since) {
        setMessages(data.messages || [])
        const latest = data.messages?.[data.messages.length - 1]?.created_at
        if (latest) lastSyncRef.current = latest
      }

      setIntroPending(Boolean(data.introPending))
      setWaitingOnPeer(Boolean(data.waitingOnPeer))
      setChatUnlocked(Boolean(data.chatUnlocked))
      // Only mark read when something new arrived from the other person, not on every poll.
      const incoming = (data.messages || []).some((m) => m.from_user_id !== user?.id && !m.read_at)
      if (incoming) await apiFetch(`/messages/${userId}/read`, { method: 'POST' }, token).catch(() => null)
    },
    [token, userId, mergeMessage, closed, user?.id]
  )

  useEffect(() => {
    if (closed) return
    loadMessages().catch(() => null)
    const intervalMs = realtimeChannel ? 20000 : 5000
    const timer = setInterval(() => {
      loadMessages(lastSyncRef.current).catch(() => null)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [loadMessages, realtimeChannel, closed])

  useEffect(() => {
    if (!realtimeChannel) return
    return subscribeChatChannel(realtimeChannel, {
      onMessage: (payload) => {
        const msg = payload as ChatMessage
        if (msg?.id) mergeMessage(msg)
      },
      onRead: () => {
        loadMessages(lastSyncRef.current).catch(() => null)
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
      await loadMessages()
    } catch (err) {
      Alert.alert('Message not sent', err instanceof Error ? err.message : 'Try again')
    }
  }

  function blockUser() {
    Alert.alert('Block this person?', 'You will no longer see or message each other. They are not notified.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/safety/block', { method: 'POST', body: JSON.stringify({ userId }) }, token)
            router.back()
          } catch (err) {
            Alert.alert('Could not block', err instanceof Error ? err.message : 'Try again')
          }
        }
      }
    ])
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {introPending && !chatUnlocked && (
        <Text style={styles.banner}>Send one hello — chat unlocks after you both message once.</Text>
      )}
      {waitingOnPeer && (
        <Text style={styles.banner}>Your hello is in. Wait for them to reply before sending more.</Text>
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
      {closed ? (
        <Text style={[styles.banner, { paddingBottom: 12 }]}>This conversation is no longer available.</Text>
      ) : (
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Say hello…"
            placeholderTextColor={colors.muted}
            maxLength={2000}
          />
          <Pressable style={styles.sendBtn} onPress={send} accessibilityRole="button">
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      )}
      {!closed && (
        <View style={styles.safetyRow}>
          <Pressable style={styles.reportBtn} onPress={() => setReporting(true)}>
            <Text style={styles.reportText}>Report</Text>
          </Pressable>
          <Pressable style={styles.reportBtn} onPress={blockUser}>
            <Text style={styles.reportText}>Block</Text>
          </Pressable>
        </View>
      )}
      <ReportSheet
        visible={reporting}
        userId={String(userId)}
        onClose={() => setReporting(false)}
        onReported={(blocked) => {
          setReporting(false)
          if (blocked) router.back()
          else Alert.alert('Report submitted', 'Our team will review this conversation within 24 hours.')
        }}
      />
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
  safetyRow: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  reportBtn: { paddingBottom: 12, alignItems: 'center' },
  reportText: { color: colors.muted, fontSize: 12, textDecorationLine: 'underline' }
})
