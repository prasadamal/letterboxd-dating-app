import { Ionicons } from '@expo/vector-icons'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReportSheet } from '../../components/ReportSheet'
import { Avatar } from '../../components/ui'
import { ApiError, apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { haptic } from '../../lib/haptics'
import { subscribeChatChannel } from '../../lib/realtime'
import { colors, fonts, radii, type } from '../../lib/theme'
import type { ChatMessage, TasteComparison } from '../../lib/types'

type ChatPayload = {
  messages: ChatMessage[]
  introPending?: boolean
  waitingOnPeer?: boolean
  chatUnlocked?: boolean
  realtimeChannel?: string
}

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [introPending, setIntroPending] = useState(false)
  const [waitingOnPeer, setWaitingOnPeer] = useState(false)
  const [chatUnlocked, setChatUnlocked] = useState(true)
  const [realtimeChannel, setRealtimeChannel] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [starters, setStarters] = useState<string[]>([])
  const [peer, setPeer] = useState<TasteComparison | null>(null)
  const [sending, setSending] = useState(false)
  const lastSyncRef = useRef<string | null>(null)
  const listRef = useRef<FlatList<ChatMessage>>(null)

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
      if (!userId || closed) return
      const query = since ? `?since=${encodeURIComponent(since)}` : ''
      let data: ChatPayload
      try {
        data = await apiFetch<ChatPayload>(`/messages/${userId}${query}`)
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
      if (incoming) await apiFetch(`/messages/${userId}/read`, { method: 'POST' }).catch(() => null)
    },
    [userId, mergeMessage, closed, user?.id]
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
    // Signals carry no content; fetch what changed through the authenticated API.
    return subscribeChatChannel(realtimeChannel, {
      onMessage: () => loadMessages(lastSyncRef.current).catch(() => null),
      onRead: () => loadMessages().catch(() => null)
    })
  }, [realtimeChannel, loadMessages])

  useEffect(() => {
    if (!userId) return
    apiFetch<{ starters: string[] }>(`/messages/${userId}/starters`)
      .then((data) => setStarters(data.starters || []))
      .catch(() => null)
    apiFetch<TasteComparison>(`/friends/compare/${userId}`)
      .then(setPeer)
      .catch(() => null)
  }, [userId])

  const sentAny = messages.some((m) => m.from_user_id === user?.id)
  const peerName = peer?.person.name || name || 'Chat'
  const lastMine = [...messages].reverse().find((m) => m.from_user_id === user?.id)

  async function send() {
    if (!userId || !text.trim() || sending) return
    setSending(true)
    try {
      const data = await apiFetch<{ message: ChatMessage }>('/messages', { method: 'POST', body: JSON.stringify({ toUserId: userId, text }) })
      haptic.tap()
      mergeMessage(data.message)
      setText('')
      await loadMessages()
    } catch (err) {
      Alert.alert('Message not sent', err instanceof Error ? err.message : 'Try again')
    } finally {
      setSending(false)
    }
  }

  function block() {
    Alert.alert(`Block ${peerName}?`, 'You will no longer see or message each other. They are not notified.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/safety/block', { method: 'POST', body: JSON.stringify({ userId }) })
            router.back()
          } catch (err) {
            Alert.alert('Could not block', err instanceof Error ? err.message : 'Try again')
          }
        }
      }
    ])
  }

  function menu() {
    Alert.alert(peerName, undefined, [
      { text: 'See taste match', onPress: () => router.push({ pathname: '/compare/[userId]', params: { userId: String(userId), name: peerName } }) },
      { text: 'Report', onPress: () => setReporting(true) },
      { text: 'Block', style: 'destructive', onPress: block },
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  const notice = closed
    ? 'This conversation is no longer available.'
    : waitingOnPeer
      ? `Your hello is in. Chat opens when ${peerName} replies.`
      : introPending && !chatUnlocked
        ? 'Say hi! Chat opens once you’ve both sent a hello.'
        : null

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              style={styles.headerTitle}
              onPress={() => router.push({ pathname: '/compare/[userId]', params: { userId: String(userId), name: peerName } })}
              accessibilityRole="button"
              accessibilityLabel={`${peerName}, see taste match`}
            >
              <Avatar uri={peer?.person.photo_url} name={peerName} size={34} />
              <View>
                <Text style={styles.headerName}>{peerName}</Text>
                {peer && <Text style={styles.headerScore}>{peer.score}% taste match</Text>}
              </View>
            </Pressable>
          ),
          headerRight: () =>
            closed ? null : (
              <Pressable onPress={menu} hitSlop={10} accessibilityRole="button" accessibilityLabel="More options">
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
              </Pressable>
            )
        }}
      />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          peer && !messages.length ? (
            <View style={styles.intro}>
              <Avatar uri={peer.person.photo_url} name={peerName} size={88} ring />
              <Text style={type.h2}>You matched with {peerName}</Text>
              <Text style={[type.small, { textAlign: 'center' }]}>
                {peer.score}% taste match · {peer.sharedCount} films in common
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.from_user_id === user?.id
          return (
            <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.text}</Text>
              </View>
              {mine && item.id === lastMine?.id && item.read_at ? <Text style={styles.read}>Read</Text> : null}
            </View>
          )
        }}
      />

      {!!notice && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      )}

      {!closed && !sentAny && starters.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.startersScroll} contentContainerStyle={styles.starters} keyboardShouldPersistTaps="handled">
          {starters.map((idea) => (
            <Pressable key={idea} style={styles.starter} onPress={() => setText(idea)} accessibilityRole="button" accessibilityLabel={`Use: ${idea}`}>
              <Text style={styles.starterText}>{idea}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {!closed && (
        <View style={[styles.composer, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={sentAny ? 'Message' : 'Say hi…'}
            placeholderTextColor={colors.faint}
            maxLength={2000}
            multiline
            // Web renders a two-row textarea by default; native grows from one line on its own.
            {...(Platform.OS === 'web' ? { numberOfLines: 1 } : {})}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={[styles.send, (!text.trim() || sending) && { opacity: 0.4 }]}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={22} color={colors.onLime} />
          </Pressable>
        </View>
      )}

      <ReportSheet
        visible={reporting}
        userId={String(userId)}
        userName={peerName}
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
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { fontFamily: fonts.bold, color: colors.text, fontSize: 16 },
  headerScore: { fontFamily: fonts.semi, color: colors.lime, fontSize: 12 },
  list: { padding: 16, gap: 6, flexGrow: 1, justifyContent: 'flex-end' },
  intro: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  bubbleRow: { alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { backgroundColor: colors.lime, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.cardHigh, borderBottomLeftRadius: 6 },
  bubbleText: { color: colors.text, fontSize: 16, lineHeight: 21 },
  mineText: { color: colors.onLime },
  read: { color: colors.faint, fontSize: 11, marginTop: 3, marginRight: 4 },
  notice: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(212,255,63,0.08)', borderColor: 'rgba(212,255,63,0.3)', borderWidth: 1, borderRadius: radii.md, padding: 10 },
  noticeText: { color: colors.soft, fontSize: 13, textAlign: 'center' },
  // A ScrollView grows to fill free space by default; the starters row should only be as tall as its chips.
  startersScroll: { flexGrow: 0, flexShrink: 0 },
  starters: { gap: 8, paddingHorizontal: 16, paddingBottom: 10, alignItems: 'flex-start' },
  starter: { maxWidth: 260, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10 },
  starterText: { color: colors.text, fontSize: 14, lineHeight: 19 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, maxHeight: 120, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 16, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }
})
