import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { haptic } from '../lib/haptics'
import { colors, fonts, radii } from '../lib/theme'
import type { Movie, Reaction } from '../lib/types'
import { IconButton, Poster } from './ui'

type Props = {
  movies: Movie[]
  total: number
  onRate: (movie: Movie, reaction: Reaction) => Promise<void>
}

const SWIPE_X = 110
const SWIPE_Y = 120

// What the crowd thought, shown right after you vote (everyone gets the same films each day). It names the
// film because it appears over the next card.
export function revealText(movie: Movie, reaction: Reaction) {
  const title = movie.title.length > 28 ? `${movie.title.slice(0, 26)}…` : movie.title
  if (reaction === 'skip') return `👀 Haven't seen ${title}? It won't count.`
  const pct = movie.community?.likedPercent
  if (pct == null || !movie.community?.votes) return `🥇 First vote on ${title} today`
  if (reaction === 'love') {
    if (pct >= 50) return `💚 ${pct}% loved ${title} too`
    if (pct < 35) return `🌶️ Hot take! Only ${pct}% liked ${title}`
    return `🤏 ${pct}% liked ${title}. Split crowd`
  }
  const passed = 100 - pct
  if (passed >= 50) return `🤝 ${passed}% weren't feeling ${title} either`
  if (passed < 35) return `🌶️ Hot take! ${pct}% loved ${title}`
  return `🤏 ${passed}% passed on ${title} too`
}

export function FilmSwipeDeck({ movies, total, onRate }: Props) {
  const { width, height } = useWindowDimensions()
  const cardWidth = Math.min(width - 40, 420)
  const cardHeight = Math.min(Math.round(cardWidth * 1.36), Math.round(height * 0.52))

  const [queue, setQueue] = useState<Movie[]>(movies)
  const [reveal, setReveal] = useState<string | null>(null)
  const [error, setError] = useState('')
  const position = useRef(new Animated.ValueXY()).current
  const revealOpacity = useRef(new Animated.Value(0)).current
  const busy = useRef(false)
  const queueRef = useRef(queue)
  queueRef.current = queue
  const onRateRef = useRef(onRate)
  onRateRef.current = onRate

  useEffect(() => {
    setQueue(movies)
  }, [movies])

  function showReveal(text: string) {
    setReveal(text)
    revealOpacity.setValue(0)
    Animated.sequence([
      Animated.timing(revealOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(revealOpacity, { toValue: 0, duration: 260, useNativeDriver: true })
    ]).start()
  }

  function commit(reaction: Reaction) {
    const movie = queueRef.current[0]
    if (!movie || busy.current) return
    busy.current = true
    haptic.swipe()
    const to = reaction === 'love' ? { x: width * 1.3, y: 40 } : reaction === 'hate' ? { x: -width * 1.3, y: 40 } : { x: 0, y: -height }
    Animated.timing(position, { toValue: to, duration: 230, useNativeDriver: true }).start(() => {
      setQueue((list) => list.slice(1))
      position.setValue({ x: 0, y: 0 })
      busy.current = false
      showReveal(revealText(movie, reaction))
      setError('')
      onRateRef.current(movie, reaction).catch((err) => {
        // Put the film back so nothing is lost.
        setQueue((list) => [movie, ...list.filter((m) => m.id !== movie.id)])
        setError(err instanceof Error ? err.message : 'Could not save that one. Try again.')
      })
    })
  }

  // The responder is created once; it calls the latest commit through a ref.
  const commitRef = useRef(commit)
  commitRef.current = commit
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !busy.current && (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6),
        onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_X) return commitRef.current('love')
          if (g.dx < -SWIPE_X) return commitRef.current('hate')
          if (g.dy < -SWIPE_Y && Math.abs(g.dy) > Math.abs(g.dx)) return commitRef.current('skip')
          Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: true }).start()
        },
        onPanResponderTerminate: () => Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start()
      }),
    [position]
  )

  const rotate = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-14deg', '0deg', '14deg'] })
  const loveOpacity = position.x.interpolate({ inputRange: [20, SWIPE_X], outputRange: [0, 1], extrapolate: 'clamp' })
  const nahOpacity = position.x.interpolate({ inputRange: [-SWIPE_X, -20], outputRange: [1, 0], extrapolate: 'clamp' })
  const skipOpacity = position.y.interpolate({ inputRange: [-SWIPE_Y, -30], outputRange: [1, 0], extrapolate: 'clamp' })
  const nextScale = position.x.interpolate({ inputRange: [-SWIPE_X, 0, SWIPE_X], outputRange: [1, 0.95, 1], extrapolate: 'clamp' })

  const done = total - queue.length
  const visible = queue.slice(0, 3)

  return (
    <View style={styles.wrap}>
      <View style={styles.progressRow} accessibilityLabel={`${done} of ${total} films rated`}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.progressDot, i < done && styles.progressDotOn]} />
        ))}
      </View>

      <View style={{ width: cardWidth, height: cardHeight + 16 }}>
        {visible
          .map((movie, i) => {
            if (i === 0) {
              return (
                <Animated.View
                  key={movie.id}
                  {...responder.panHandlers}
                  style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate }] }]}
                  accessibilityRole="adjustable"
                  accessibilityLabel={`${movie.title}, ${movie.year}. Swipe right if you liked it, left if you didn't, up if you haven't seen it.`}
                >
                  <Poster film={movie} width={cardWidth} height={cardHeight} />
                  <Animated.View style={[styles.stamp, styles.stampLove, { opacity: loveOpacity }]}>
                    <Text style={[styles.stampText, { color: colors.lime }]}>LOVED IT</Text>
                  </Animated.View>
                  <Animated.View style={[styles.stamp, styles.stampNah, { opacity: nahOpacity }]}>
                    <Text style={[styles.stampText, { color: colors.red }]}>NAH</Text>
                  </Animated.View>
                  <Animated.View style={[styles.stamp, styles.stampSkip, { opacity: skipOpacity }]}>
                    <Text style={[styles.stampText, { color: colors.cyan }]}>NOT SEEN</Text>
                  </Animated.View>
                </Animated.View>
              )
            }
            return (
              <Animated.View
                key={movie.id}
                pointerEvents="none"
                style={[styles.card, { top: i * 8, opacity: 1 - i * 0.25, transform: [{ scale: i === 1 ? nextScale : 0.9 }] }]}
              >
                <Poster film={movie} width={cardWidth} height={cardHeight} />
              </Animated.View>
            )
          })
          .reverse()}
        {reveal && (
          <Animated.View pointerEvents="none" style={[styles.reveal, { opacity: revealOpacity }]}>
            <Text style={styles.revealText}>{reveal}</Text>
          </Animated.View>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <IconButton icon="close" size={64} color={colors.red} accessibilityLabel="Didn't like it" onPress={() => commit('hate')} />
        <IconButton icon="eye-off-outline" size={50} color={colors.cyan} accessibilityLabel="Haven't seen it" onPress={() => commit('skip')} />
        <IconButton icon="heart" size={64} color="#fff" background={colors.pink} border={colors.pink} accessibilityLabel="Loved it" onPress={() => commit('love')} />
      </View>
      <Text style={styles.hint}>Swipe right if you liked it · left if not · up if you haven't seen it</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  progressRow: { flexDirection: 'row', gap: 5, alignSelf: 'stretch', paddingHorizontal: 20 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  progressDotOn: { backgroundColor: colors.lime },
  card: { position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  stamp: { position: 'absolute', top: 28, borderWidth: 3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.25)' },
  stampLove: { left: 22, borderColor: colors.lime, transform: [{ rotate: '-12deg' }] },
  stampNah: { right: 22, borderColor: colors.red, transform: [{ rotate: '12deg' }] },
  stampSkip: { alignSelf: 'center', left: '30%', top: 90, borderColor: colors.cyan },
  stampText: { fontFamily: fonts.display, fontSize: 28, letterSpacing: 1 },
  reveal: { position: 'absolute', alignSelf: 'center', top: '42%', backgroundColor: 'rgba(8,8,11,0.92)', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 18, paddingVertical: 12, maxWidth: '92%' },
  revealText: { fontFamily: fonts.bold, color: colors.text, fontSize: 16, textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 26, marginTop: 4 },
  hint: { color: colors.faint, fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },
  error: { color: colors.red, textAlign: 'center' }
})
