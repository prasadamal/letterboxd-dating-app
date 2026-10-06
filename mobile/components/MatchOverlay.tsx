import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Modal, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts, type } from '../lib/theme'
import type { DatingProfile } from '../lib/types'
import { Avatar, Button } from './ui'

type Props = {
  match: DatingProfile | null
  me: { name: string; photo_url?: string | null } | null
  onChat: () => void
  onClose: () => void
}

// The "It's a match" moment: both faces, the taste match and a straight path to saying hi.
export function MatchOverlay({ match, me, onChat, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const scale = useRef(new Animated.Value(0.6)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!match) return
    scale.setValue(0.6)
    opacity.setValue(0)
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true })
    ]).start()
  }, [match, scale, opacity])

  const firstShared = match?.sharedLoved?.[0]
  return (
    <Modal visible={Boolean(match)} animationType="fade" transparent onRequestClose={onClose}>
      <LinearGradient colors={['#8B6CFF', '#FF4F9A', '#FF8A3D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        {match && (
          <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
            <Text style={styles.kicker}>🎬 IT'S A</Text>
            <Text style={styles.title}>MATCH</Text>
            <View style={styles.faces}>
              <View style={[styles.face, { transform: [{ rotate: '-8deg' }] }]}>
                <Avatar uri={me?.photo_url} name={me?.name} size={128} />
              </View>
              <View style={[styles.face, styles.faceRight, { transform: [{ rotate: '8deg' }] }]}>
                <Avatar uri={match.photo_url} name={match.name} size={128} />
              </View>
            </View>
            <Text style={styles.score}>{Math.round(match.score)}% film-compatible</Text>
            <Text style={[type.body, styles.sub]}>
              {firstShared ? `You both loved ${firstShared.replace(/\s*\(\d{4}\)$/, '')}. Start there.` : `You and ${match.name} liked each other.`}
            </Text>
          </Animated.View>
        )}
        <View style={styles.actions}>
          <Button title={`Say hi to ${match?.name ?? ''}`} icon="chatbubble-ellipses" onPress={onChat} />
          <Button title="Keep swiping" variant="ghost" onPress={onClose} />
        </View>
      </LinearGradient>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  content: { alignItems: 'center', gap: 10, marginTop: 20 },
  kicker: { fontFamily: fonts.bold, color: 'rgba(255,255,255,0.9)', fontSize: 18, letterSpacing: 4 },
  title: { fontFamily: fonts.display, color: '#fff', fontSize: 76, lineHeight: 78, letterSpacing: -3 },
  faces: { flexDirection: 'row', marginVertical: 18 },
  face: { borderRadius: 70, borderWidth: 4, borderColor: '#fff', backgroundColor: '#fff' },
  faceRight: { marginLeft: -26 },
  score: { fontFamily: fonts.display, color: colors.onLime, backgroundColor: colors.lime, fontSize: 22, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, overflow: 'hidden' },
  sub: { color: '#fff', textAlign: 'center', marginTop: 6 },
  actions: { gap: 4 }
})
