import { useMemo, useRef, type ReactNode } from 'react'
import { Animated, PanResponder, StyleSheet, Text, useWindowDimensions } from 'react-native'
import { haptic } from '../lib/haptics'
import { colors, fonts } from '../lib/theme'
import type { DatingProfile } from '../lib/types'
import { TasteProfileCard } from './TasteProfileCard'

type Props = {
  profile: DatingProfile
  onSwipe: (action: 'like' | 'pass') => void
  // The page scrolls vertically; it is locked while a horizontal drag is in progress.
  onDragChange?: (dragging: boolean) => void
  actions?: ReactNode
}

const SWIPE_THRESHOLD = 110

export function SwipeDatingCard({ profile, onSwipe, onDragChange, actions }: Props) {
  const { width } = useWindowDimensions()
  const position = useRef(new Animated.ValueXY()).current
  const latest = useRef({ onSwipe, onDragChange, width })
  latest.current = { onSwipe, onDragChange, width }

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Only horizontal drags: vertical ones scroll the profile.
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => latest.current.onDragChange?.(true),
        onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.15 }),
        onPanResponderRelease: (_, g) => {
          latest.current.onDragChange?.(false)
          const action = g.dx > SWIPE_THRESHOLD ? 'like' : g.dx < -SWIPE_THRESHOLD ? 'pass' : null
          if (!action) {
            Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: true }).start()
            return
          }
          haptic.swipe()
          const x = (action === 'like' ? 1 : -1) * latest.current.width * 1.4
          Animated.timing(position, { toValue: { x, y: g.dy * 0.15 }, duration: 200, useNativeDriver: true }).start(() => {
            position.setValue({ x: 0, y: 0 })
            latest.current.onSwipe(action)
          })
        },
        onPanResponderTerminate: () => {
          latest.current.onDragChange?.(false)
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start()
        }
      }),
    [position]
  )

  const rotate = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-10deg', '0deg', '10deg'] })
  const likeOpacity = position.x.interpolate({ inputRange: [20, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' })
  const passOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20], outputRange: [1, 0], extrapolate: 'clamp' })

  return (
    <Animated.View style={{ transform: [...position.getTranslateTransform(), { rotate }] }} {...responder.panHandlers}>
      <TasteProfileCard profile={profile} actions={actions} />
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.like, { opacity: likeOpacity }]}>
        <Text style={[styles.stampText, { color: colors.lime }]}>LIKE</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.pass, { opacity: passOpacity }]}>
        <Text style={[styles.stampText, { color: colors.red }]}>PASS</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  stamp: { position: 'absolute', top: 90, borderWidth: 4, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.25)' },
  like: { left: 24, borderColor: colors.lime, transform: [{ rotate: '-14deg' }] },
  pass: { right: 24, borderColor: colors.red, transform: [{ rotate: '14deg' }] },
  stampText: { fontFamily: fonts.display, fontSize: 40, letterSpacing: 2 }
})
