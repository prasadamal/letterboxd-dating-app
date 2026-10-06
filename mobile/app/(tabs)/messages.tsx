import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TasteProfileCard } from '../../components/TasteProfileCard'
import { Avatar, Button, Card, EmptyState, ScreenHeader, SectionTitle, Tag } from '../../components/ui'
import { apiFetch } from '../../lib/api'
import { shortTime } from '../../lib/format'
import { haptic } from '../../lib/haptics'
import { colors, fonts, radii, type } from '../../lib/theme'
import type { ConversationPreview, LikesYou, Match } from '../../lib/types'

// Chats: who likes you, new matches waiting for a hello, and conversations (newest activity first).
export default function ChatsScreen() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationPreview[] | null>(null)
  const [likes, setLikes] = useState<LikesYou | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [convos, likesYou] = await Promise.all([
      apiFetch<{ conversations: ConversationPreview[] }>('/messages/conversations').catch(() => ({ conversations: [] as ConversationPreview[] })),
      apiFetch<LikesYou>('/dating/likes-you').catch(() => null)
    ])
    setConversations(convos.conversations || [])
    setLikes(likesYou)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function likeBack(profile: Match) {
    try {
      const result = await apiFetch<{ matched: boolean }>('/dating/swipe', { method: 'POST', body: JSON.stringify({ targetId: profile.id, action: 'like' }) })
      if (result.matched) haptic.success()
      await load()
      if (result.matched) router.push({ pathname: '/chat/[userId]', params: { userId: profile.id, name: profile.name } })
    } catch (err) {
      Alert.alert('Could not like back', err instanceof Error ? err.message : 'Try again')
    }
  }

  const open = (peer: ConversationPreview['peer']) => router.push({ pathname: '/chat/[userId]', params: { userId: peer.id, name: peer.name } })
  const fresh = (conversations || []).filter((c) => !c.lastMessage)
  const threads = (conversations || []).filter((c) => c.lastMessage)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.lime}
          onRefresh={async () => {
            setRefreshing(true)
            await load()
            setRefreshing(false)
          }}
        />
      }
    >
      <ScreenHeader title="Chats" />
      <View style={styles.body}>
        {!!likes?.count && (
          <Card style={styles.likesCard}>
            <View style={styles.likesHead}>
              {!likes.plus && (
                <View style={styles.blurFaces}>
                  {[0, 1, 2].slice(0, Math.min(3, likes.count)).map((i) => (
                    <LinearGradient key={i} colors={i % 2 ? ['#8B6CFF', '#45D6FF'] : ['#FF4F9A', '#FF8A3D']} style={[styles.blurFace, { marginLeft: i ? -14 : 0 }]}>
                      <Text style={styles.blurFaceText}>?</Text>
                    </LinearGradient>
                  ))}
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={type.h3}>
                  {likes.count} {likes.count === 1 ? 'person likes' : 'people like'} you
                </Text>
                <Text style={type.small}>
                  {likes.plus ? 'Like them back to match.' : 'Keep swiping in Match to find them, or see everyone now with Plus.'}
                </Text>
              </View>
            </View>
            {likes.plus &&
              likes.profiles.map((profile) => (
                <View key={profile.id} style={styles.likeRow}>
                  <TasteProfileCard profile={profile} compact />
                  <Button title="Like back" icon="heart" variant="love" size="md" onPress={() => likeBack(profile)} />
                </View>
              ))}
          </Card>
        )}

        {fresh.length > 0 && (
          <>
            <SectionTitle title="New matches" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.freshRow} style={styles.freshScroll}>
              {fresh.map((c) => (
                <Pressable key={String(c.matchId)} onPress={() => open(c.peer)} style={styles.freshItem} accessibilityRole="button" accessibilityLabel={`Say hi to ${c.peer.name}`}>
                  <Avatar uri={c.peer.avatar_url} name={c.peer.name} size={72} ring />
                  <Text style={styles.freshName} numberOfLines={1}>{c.peer.name}</Text>
                  <Text style={styles.freshScore}>{Math.round(c.compatibility)}%</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {threads.length > 0 && <SectionTitle title="Messages" />}
        {threads.map((c) => {
          const unread = (c.unread ?? 0) > 0
          const yourTurn = !c.chatUnlocked && c.lastMessage && !c.lastMessage.fromSelf
          return (
            <Pressable key={String(c.matchId)} onPress={() => open(c.peer)} style={({ pressed }) => [styles.thread, pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel={`Chat with ${c.peer.name}${unread ? `, ${c.unread} unread` : ''}`}>
              <Avatar uri={c.peer.avatar_url} name={c.peer.name} size={56} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.threadTop}>
                  <Text style={styles.threadName} numberOfLines={1}>{c.peer.name}</Text>
                  <Text style={styles.threadTime}>{shortTime(c.lastMessage?.at)}</Text>
                </View>
                <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                  {c.lastMessage?.fromSelf ? 'You: ' : ''}
                  {c.lastMessage?.text}
                </Text>
                {yourTurn && <Tag label="Your turn: say hi back" tone="lime" />}
              </View>
              {unread ? (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{c.unread}</Text>
                </View>
              ) : (
                <Text style={styles.score}>{Math.round(c.compatibility)}%</Text>
              )}
            </Pressable>
          )
        })}

        {conversations !== null && !conversations.length && !likes?.count && (
          <EmptyState emoji="💌" title="No matches yet" body="Like people in Match. When it's mutual, they show up here and you can say hi.">
            <Button title="Go to Match" icon="heart" onPress={() => router.push('/(tabs)/dating')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </EmptyState>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 16, gap: 12 },
  likesCard: { borderColor: 'rgba(255,79,154,0.45)', backgroundColor: 'rgba(255,79,154,0.08)' },
  likesHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  blurFaces: { flexDirection: 'row' },
  blurFace: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
  blurFaceText: { fontFamily: fonts.display, color: '#fff', fontSize: 20 },
  likeRow: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  freshScroll: { marginHorizontal: -16 },
  freshRow: { gap: 14, paddingHorizontal: 16 },
  freshItem: { alignItems: 'center', gap: 4, width: 78 },
  freshName: { fontFamily: fonts.bold, color: colors.text, fontSize: 13, maxWidth: 76 },
  freshScore: { fontFamily: fonts.semi, color: colors.lime, fontSize: 12 },
  thread: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 12 },
  threadTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  threadName: { flex: 1, fontFamily: fonts.bold, color: colors.text, fontSize: 16 },
  threadTime: { color: colors.faint, fontSize: 12 },
  preview: { color: colors.muted, fontSize: 14 },
  previewUnread: { color: colors.text, fontWeight: '600' },
  unread: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontFamily: fonts.bold, color: colors.onLime, fontSize: 12 },
  score: { fontFamily: fonts.bold, color: colors.faint, fontSize: 13 }
})
