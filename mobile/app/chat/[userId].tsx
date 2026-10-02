import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'
import type { ChatMessage } from '../../lib/types'

export default function ChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (!token || !userId) return
    apiFetch<{ messages: ChatMessage[] }>(`/messages/${userId}`, {}, token)
      .then((data) => setMessages(data.messages || []))
      .catch(console.error)
  }, [token, userId])

  async function send() {
    if (!token || !userId || !text.trim()) return
    const data = await apiFetch<{ message: ChatMessage }>(
      '/messages',
      { method: 'POST', body: JSON.stringify({ toUserId: userId, text }) },
      token
    )
    setMessages((current) => [...current, data.message])
    setText('')
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from_user_id === user?.id && styles.mine]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Say hello…" placeholderTextColor={colors.muted} />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border, maxWidth: '85%' },
  mine: { alignSelf: 'flex-end', backgroundColor: 'rgba(173,124,255,0.15)' },
  bubbleText: { color: colors.text },
  composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, backgroundColor: colors.card },
  sendBtn: { backgroundColor: colors.pink, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700' }
})
