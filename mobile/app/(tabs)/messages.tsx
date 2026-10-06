import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { EmptyState } from '../../components/EmptyState'
import { colors, typography } from '../../lib/theme'
import type { ConversationPreview } from '../../lib/types'

export default function MessagesScreen() {
  const { token } = useAuth()
  const { platform } = usePlatform()
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationPreview[]>([])

  useEffect(() => {
    if (!token || !platform?.datingLaunched) return
    apiFetch<{ conversations: ConversationPreview[] }>('/messages/conversations', {}, token)
      .then((data) => setConversations(data.conversations || []))
      .catch(() => null)
  }, [token, platform?.datingLaunched])

  if (!platform?.datingLaunched) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Inbox locked" body="Messaging opens when dating opens in your country." emoji="💬" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.matchId)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <>
            <Text style={styles.kicker}>MESSAGING CENTER</Text>
            <Text style={styles.title}>Conversations</Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState title="No chats yet" body="Match with someone in Dating, then say hello here." emoji="✨" />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push({ pathname: '/chat/[userId]', params: { userId: item.peer.id, name: item.peer.name } })}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>
                {item.peer.name}
                {item.peer.age ? `, ${item.peer.age}` : ''}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage?.text || 'Tap to start your intro'}
              </Text>
              {!item.chatUnlocked && <Text style={styles.intro}>Intro pending — one hello each</Text>}
            </View>
            <Text style={styles.score}>{Math.round(item.compatibility)}%</Text>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  kicker: { color: colors.peach, ...typography.caption, marginBottom: 6 },
  title: { color: colors.text, ...typography.title, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  name: { color: colors.text, fontWeight: '700' },
  preview: { color: colors.muted, fontSize: 13 },
  intro: { color: colors.peach, fontSize: 11 },
  score: { color: colors.accent, fontWeight: '800' }
})
