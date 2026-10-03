import { useRef } from 'react'
import { Animated, PanResponder, StyleSheet, View } from 'react-native'
import { colors } from '../lib/theme'
import { TasteProfileCard } from './TasteProfileCard'
import type { DatingProfile } from '../lib/types'

type Props = {
  profile: DatingProfile
  onSwipe: (action: 'like' | 'pass') => void
}

const SWIPE_THRESHOLD = 96

export function SwipeDatingCard({ profile, onSwipe }: Props) {
  const position = useRef(new Animated.ValueXY()).current
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.2 })
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, { toValue: { x: 420, y: gesture.dy }, duration: 180, useNativeDriver: false }).start(() => {
            position.setValue({ x: 0, y: 0 })
            onSwipeRef.current('like')
          })
          return
        }
        if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, { toValue: { x: -420, y: gesture.dy }, duration: 180, useNativeDriver: false }).start(() => {
            position.setValue({ x: 0, y: 0 })
            onSwipeRef.current('pass')
          })
          return
        }
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
      }
    })
  ).current

  const rotate = position.x.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ['-8deg', '0deg', '8deg']
  })

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
      {...panResponder.panHandlers}
    >
      <TasteProfileCard profile={profile} />
      <View style={styles.hintRow}>
        <View style={[styles.hint, styles.passHint]} />
        <View style={[styles.hint, styles.likeHint]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  hintRow: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  hint: { width: 56, height: 4, borderRadius: 999, opacity: 0.35 },
  passHint: { backgroundColor: colors.error },
  likeHint: { backgroundColor: colors.green }
})
