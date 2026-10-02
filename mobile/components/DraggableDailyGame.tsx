import { useEffect, useRef, useState } from 'react'
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native'
import type { Movie } from '../lib/types'
import { colors } from '../lib/theme'
import { movieLabel } from '../lib/api'

type Props = {
  movies: Movie[]
  onRate: (movie: Movie, reaction: 'love' | 'hate') => Promise<void>
}

type Rect = { x: number; y: number; width: number; height: number }

export function DraggableDailyGame({ movies, onRate }: Props) {
  const [pending, setPending] = useState<Movie[]>(movies)
  const likeZone = useRef<Rect | null>(null)
  const hateZone = useRef<Rect | null>(null)
  const pan = useRef(new Animated.ValueXY()).current

  useEffect(() => {
    setPending(movies)
  }, [movies])

  const active = pending[0] || null

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(active),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: async (_, gesture) => {
        if (!active) return
        const dropX = gesture.moveX
        const dropY = gesture.moveY
        let reaction: 'love' | 'hate' | null = null

        const like = likeZone.current
        const hate = hateZone.current
        if (like && dropX >= like.x && dropX <= like.x + like.width && dropY >= like.y && dropY <= like.y + like.height) {
          reaction = 'love'
        } else if (
          hate &&
          dropX >= hate.x &&
          dropX <= hate.x + hate.width &&
          dropY >= hate.y &&
          dropY <= hate.y + hate.height
        ) {
          reaction = 'hate'
        }

        if (reaction) {
          const current = active
          setPending((list) => list.filter((item) => item.id !== current.id))
          pan.setValue({ x: 0, y: 0 })
          await onRate(current, reaction)
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
        }
      }
    })
  ).current

  return (
    <View style={styles.wrap}>
      <Text style={styles.help}>Drag each film into I like or I don't like — 10 picks per day.</Text>
      <Text style={styles.counter}>{pending.length} left today</Text>
      <View style={styles.deckArea}>
        {active ? (
          <Animated.View style={[styles.card, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
            <Text style={styles.meta}>{active.genres?.[0] || 'Film'} · {active.origin_language || 'Global'}</Text>
            <Text style={styles.title}>{movieLabel(active)}</Text>
            <Text style={styles.hint}>Drag down into a bucket</Text>
          </Animated.View>
        ) : (
          <Text style={styles.done}>Today's taste game is complete. See you tomorrow for more films.</Text>
        )}
      </View>

      <View style={styles.zones}>
        <View
          style={[styles.zone, styles.hateZone]}
          onLayout={(event) => {
            const target = event.target as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void }
            target.measureInWindow?.((x, y, width, height) => {
              hateZone.current = { x, y, width, height }
            })
          }}
        >
          <Text style={styles.zoneTitle}>I don't like</Text>
        </View>
        <View
          style={[styles.zone, styles.likeZone]}
          onLayout={(event) => {
            const target = event.target as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void }
            target.measureInWindow?.((x, y, width, height) => {
              likeZone.current = { x, y, width, height }
            })
          }}
        >
          <Text style={styles.zoneTitle}>I like</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 8 },
  help: { color: colors.muted, lineHeight: 20 },
  counter: { color: colors.peach, fontWeight: '700' },
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  card: {
    width: '92%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20
  },
  meta: { color: colors.peach, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  hint: { color: colors.muted, marginTop: 12 },
  done: { color: colors.soft, textAlign: 'center', paddingHorizontal: 12 },
  zones: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  zone: { flex: 1, minHeight: 110, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 10 },
  hateZone: { borderColor: 'rgba(255,157,172,0.7)', backgroundColor: 'rgba(255,105,147,0.08)' },
  likeZone: { borderColor: 'rgba(115,224,167,0.8)', backgroundColor: 'rgba(115,224,167,0.08)' },
  zoneTitle: { color: colors.text, fontWeight: '700', textAlign: 'center' }
})
