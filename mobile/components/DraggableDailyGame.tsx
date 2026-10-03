import { useEffect, useRef, useState } from 'react'
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native'
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
  const activeRef = useRef<Movie | null>(null)
  const ratingRef = useRef(false)

  useEffect(() => {
    setPending(movies)
  }, [movies])

  const active = pending[0] || null
  activeRef.current = active

  async function commit(reaction: 'love' | 'hate') {
    const current = activeRef.current
    if (!current || ratingRef.current) return
    ratingRef.current = true
    setPending((list) => list.filter((item) => item.id !== current.id))
    pan.setValue({ x: 0, y: 0 })
    try {
      await onRate(current, reaction)
    } catch (err) {
      setPending((list) => [current, ...list.filter((item) => item.id !== current.id)])
      throw err
    } finally {
      ratingRef.current = false
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(activeRef.current),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: async (_, gesture) => {
        const current = activeRef.current
        if (!current) return
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
          await commit(reaction)
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
        }
      }
    })
  ).current

  return (
    <View style={styles.wrap}>
      <Text style={styles.help}>Drag each film into a bucket, or tap Like / Dislike.</Text>
      <Text style={styles.counter}>{pending.length} left today</Text>
      <View style={styles.deckArea}>
        {active ? (
          <Animated.View style={[styles.card, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
            <Text style={styles.meta}>{active.genres?.[0] || 'Film'} · {active.origin_language || 'Global'}</Text>
            <Text style={styles.title}>{movieLabel(active)}</Text>
            <Text style={styles.hint}>Drag down into a bucket</Text>
            <View style={styles.actions}>
              <Pressable style={styles.dislikeBtn} onPress={() => commit('hate')}>
                <Text style={styles.actionText}>Dislike</Text>
              </Pressable>
              <Pressable style={styles.likeBtn} onPress={() => commit('love')}>
                <Text style={styles.actionText}>Like</Text>
              </Pressable>
            </View>
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
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dislikeBtn: { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, alignItems: 'center' },
  likeBtn: { flex: 1, borderRadius: 999, backgroundColor: colors.pink, paddingVertical: 10, alignItems: 'center' },
  actionText: { color: colors.text, fontWeight: '700' },
  done: { color: colors.soft, textAlign: 'center', paddingHorizontal: 12 },
  zones: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  zone: { flex: 1, minHeight: 110, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 10 },
  hateZone: { borderColor: 'rgba(255,157,172,0.7)', backgroundColor: 'rgba(255,105,147,0.08)' },
  likeZone: { borderColor: 'rgba(115,224,167,0.8)', backgroundColor: 'rgba(115,224,167,0.08)' },
  zoneTitle: { color: colors.text, fontWeight: '700', textAlign: 'center' }
})
