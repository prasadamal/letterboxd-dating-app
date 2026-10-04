import { useEffect, useRef, useState } from 'react'
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Movie, Reaction } from '../lib/types'
import { colors } from '../lib/theme'
import { movieLabel } from '../lib/api'

type Props = {
  movies: Movie[]
  onRate: (movie: Movie, reaction: Reaction) => Promise<void>
}

type Rect = { x: number; y: number; width: number; height: number }

export function DraggableDailyGame({ movies, onRate }: Props) {
  const [pending, setPending] = useState<Movie[]>(movies)
  const likeZone = useRef<Rect | null>(null)
  const hateZone = useRef<Rect | null>(null)
  const unseenZone = useRef<Rect | null>(null)
  const likeRef = useRef<View>(null)
  const hateRef = useRef<View>(null)
  const unseenRef = useRef<View>(null)

  // Measure through refs (event.target is not a measurable view on every platform) and re-measure when a
  // drag starts, so drops still land correctly after the screen has scrolled.
  function measureZones() {
    likeRef.current?.measureInWindow((x, y, width, height) => {
      likeZone.current = { x, y, width, height }
    })
    hateRef.current?.measureInWindow((x, y, width, height) => {
      hateZone.current = { x, y, width, height }
    })
    unseenRef.current?.measureInWindow((x, y, width, height) => {
      unseenZone.current = { x, y, width, height }
    })
  }
  const pan = useRef(new Animated.ValueXY()).current
  const activeRef = useRef<Movie | null>(null)
  const ratingRef = useRef(false)

  useEffect(() => {
    setPending(movies)
  }, [movies])

  const active = pending[0] || null
  activeRef.current = active

  async function commit(reaction: Reaction) {
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
      onPanResponderGrant: () => measureZones(),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: async (_, gesture) => {
        const current = activeRef.current
        if (!current) return
        const dropX = gesture.moveX
        const dropY = gesture.moveY
        const inside = (zone: Rect | null) =>
          Boolean(zone && dropX >= zone.x && dropX <= zone.x + zone.width && dropY >= zone.y && dropY <= zone.y + zone.height)
        const reaction: Reaction | null = inside(likeZone.current)
          ? 'love'
          : inside(hateZone.current)
            ? 'hate'
            : inside(unseenZone.current)
              ? 'skip'
              : null

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
      <Text style={styles.help}>
        Everyone rates these same films today, so you build up films in common. Drag each one into a bucket, or tap a button.
        Haven't seen it? That's fine — it won't count against anyone.
      </Text>
      <Text style={styles.counter}>{pending.length} left today</Text>
      <View style={styles.deckArea}>
        {active ? (
          <Animated.View style={[styles.card, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
            <Text style={styles.meta}>{active.genres?.[0] || 'Film'} · {active.origin_language || 'Global'}</Text>
            <Text style={styles.title}>{movieLabel(active)}</Text>
            <Text style={styles.hint}>Drag down into a bucket</Text>
            <View style={styles.actions}>
              <Pressable style={styles.dislikeBtn} onPress={() => commit('hate')} accessibilityRole="button">
                <Text style={styles.actionText}>Dislike</Text>
              </Pressable>
              <Pressable style={styles.likeBtn} onPress={() => commit('love')} accessibilityRole="button">
                <Text style={styles.actionText}>Like</Text>
              </Pressable>
            </View>
            <Pressable style={styles.unseenBtn} onPress={() => commit('skip')} accessibilityRole="button">
              <Text style={styles.unseenText}>Haven't seen it</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Text style={styles.done}>Today's taste game is complete. See you tomorrow for more films.</Text>
        )}
      </View>

      <View style={styles.zones}>
        <View ref={hateRef} style={[styles.zone, styles.hateZone]} onLayout={measureZones}>
          <Text style={styles.zoneTitle}>I don't like</Text>
        </View>
        <View ref={likeRef} style={[styles.zone, styles.likeZone]} onLayout={measureZones}>
          <Text style={styles.zoneTitle}>I like</Text>
        </View>
      </View>
      <View ref={unseenRef} style={[styles.zone, styles.unseenZone]} onLayout={measureZones}>
        <Text style={styles.zoneTitle}>Haven't seen</Text>
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
  zoneTitle: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  unseenZone: { flex: 0, minHeight: 64, borderColor: 'rgba(154,167,184,0.6)', backgroundColor: 'rgba(154,167,184,0.06)', marginBottom: 8 },
  unseenBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  unseenText: { color: colors.muted, fontWeight: '600', textDecorationLine: 'underline' }
})
