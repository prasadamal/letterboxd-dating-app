import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Sharing from 'expo-sharing'
import { useRef, useState, type ReactNode } from 'react'
import { Modal, Platform, Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { captureRef } from 'react-native-view-shot'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { haptic } from '../lib/haptics'
import { WEB_URL } from '../lib/profileOptions'
import { colors, fonts, radii } from '../lib/theme'
import type { DailyResults, Personality } from '../lib/types'
import { Button } from './ui'

// Story cards are laid out at 360×640 and saved at 1080×1920 (Instagram and WhatsApp status size).
const STORY_W = 360
const STORY_H = 640
const HOST = WEB_URL.replace(/^https?:\/\//, '')

const VOTE_SQUARE = { love: '#3DDC97', hate: '#FF5C6C', skip: '#6B6B7D' } as const

function Brand() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>R</Text>
      </View>
      <Text style={styles.brandName}>ReelMates</Text>
    </View>
  )
}

// Today's results: one square per film, how in sync you were with the crowd, and the day's talking points.
export function DailyStory({ results, personality, streak }: { results: DailyResults; personality?: Personality | null; streak?: number }) {
  const agreement = results.comparable ? Math.round((results.agreed / results.comparable) * 100) : null
  const glow = (personality?.ready ? personality.colors : ['#8B6CFF', '#45D6FF']) as [string, string]
  return (
    <View style={styles.story}>
      <LinearGradient colors={[glow[0], 'rgba(8,8,11,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.55 }} style={StyleSheet.absoluteFill} />
      <Brand />
      <View style={{ gap: 6 }}>
        <Text style={styles.kicker}>DAILY #{results.number}</Text>
        <Text style={styles.big}>{agreement === null ? 'Today’s 10 films' : `${agreement}% in sync with the crowd`}</Text>
      </View>
      <View style={styles.grid}>
        {results.films.map((film) => (
          <View key={film.id} style={styles.gridRow}>
            <View style={[styles.square, { backgroundColor: film.myRating ? VOTE_SQUARE[film.myRating] : colors.cardHigh }]} />
            <Text style={styles.gridTitle} numberOfLines={1}>
              {film.title}
            </Text>
            <Text style={styles.gridPct}>{film.likedPercent == null ? '–' : `${film.likedPercent}%`}</Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {results.mostDivisive && (
          <Text style={styles.fact}>
            ⚔️ Most divisive: <Text style={styles.factStrong}>{results.mostDivisive.title}</Text>
          </Text>
        )}
        <Text style={styles.fact}>
          {streak && streak > 1 ? `🔥 ${streak}-day streak` : '🎬 Same 10 films for everyone, every day'}
          {personality?.ready ? `  ·  ${personality.emoji} ${personality.name}` : ''}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Play today’s films</Text>
        <Text style={styles.footerHost}>{HOST}</Text>
      </View>
    </View>
  )
}

// The film personality reveal, made for Stories.
export function PersonalityStory({ personality, code }: { personality: Personality; code?: string | null }) {
  return (
    <LinearGradient colors={personality.colors as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.story}>
      <View style={styles.shine} />
      <Brand />
      <View style={{ gap: 10 }}>
        <Text style={styles.storyEmoji}>{personality.emoji}</Text>
        <Text style={styles.kickerLight}>MY FILM PERSONALITY</Text>
        <Text style={styles.personaName}>{personality.name}</Text>
        <Text style={styles.tagline}>{personality.tagline}</Text>
        {personality.traits.length > 0 && (
          <View style={styles.traits}>
            {personality.traits.map((trait) => (
              <View key={trait} style={styles.trait}>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{code ? `What’s yours? Add me: ${code}` : 'What’s yours?'}</Text>
        <Text style={styles.footerHost}>{HOST}</Text>
      </View>
    </LinearGradient>
  )
}

// Preview the card, then hand the picture to the share sheet. Where capturing isn't possible (web), share the text.
export function ShareImageSheet({
  visible,
  onClose,
  title,
  fallbackText,
  children
}: {
  visible: boolean
  onClose: () => void
  title: string
  fallbackText: string
  children: ReactNode
}) {
  const ref = useRef<View>(null)
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [busy, setBusy] = useState(false)
  const scale = Math.min(1, (width - 48) / STORY_W, (height - insets.top - insets.bottom - 200) / STORY_H)

  async function shareImage() {
    haptic.tap()
    setBusy(true)
    try {
      if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) throw new Error('no image sharing')
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: STORY_W * 3, height: STORY_H * 3, result: 'tmpfile' })
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title, UTI: 'public.png' })
    } catch {
      await Share.share({ message: fallbackText }).catch(() => null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ width: STORY_W * scale, height: STORY_H * scale, alignSelf: 'center' }}>
          <View style={{ width: STORY_W, height: STORY_H, transform: [{ scale }], transformOrigin: 'top left' }}>
            <View ref={ref} collapsable={false} style={styles.capture}>
              {children}
            </View>
          </View>
        </View>
        <View style={styles.sheetActions}>
          <Button title="Share image" icon="share-social" loading={busy} onPress={shareImage} />
          <Button title="Share as text" variant="ghost" size="md" onPress={() => Share.share({ message: fallbackText }).catch(() => null)} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,11,0.96)', paddingHorizontal: 24, justifyContent: 'space-between', gap: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: -0.4 },
  sheetActions: { gap: 6 },
  capture: { width: STORY_W, height: STORY_H, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.bg },
  story: { width: STORY_W, height: STORY_H, padding: 28, justifyContent: 'space-between', backgroundColor: colors.bg, overflow: 'hidden' },
  shine: { position: 'absolute', top: -120, right: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.18)' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { fontFamily: fonts.display, fontSize: 15, color: colors.onLime },
  brandName: { fontFamily: fonts.display, fontSize: 17, color: '#fff', letterSpacing: -0.3 },
  kicker: { fontFamily: fonts.semi, fontSize: 12, letterSpacing: 2, color: colors.lime },
  kickerLight: { fontFamily: fonts.semi, fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' },
  big: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, letterSpacing: -1.2, color: '#fff' },
  grid: { backgroundColor: 'rgba(21,21,28,0.82)', borderRadius: radii.lg, padding: 14, gap: 9 },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  square: { width: 18, height: 18, borderRadius: 5 },
  gridTitle: { flex: 1, fontFamily: fonts.semi, fontSize: 14, color: colors.text },
  gridPct: { fontFamily: fonts.bold, fontSize: 13, color: colors.soft },
  fact: { fontSize: 14, color: colors.soft, lineHeight: 20 },
  factStrong: { fontFamily: fonts.bold, color: '#fff' },
  storyEmoji: { fontSize: 84, lineHeight: 96 },
  personaName: { fontFamily: fonts.display, fontSize: 44, lineHeight: 44, letterSpacing: -1.6, color: '#fff' },
  tagline: { fontSize: 17, lineHeight: 24, color: 'rgba(255,255,255,0.95)' },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  trait: { backgroundColor: 'rgba(0,0,0,0.22)', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  traitText: { fontFamily: fonts.semi, fontSize: 13, color: '#fff' },
  footer: { backgroundColor: colors.lime, borderRadius: radii.lg, paddingVertical: 14, paddingHorizontal: 18, gap: 2 },
  footerText: { fontFamily: fonts.display, fontSize: 18, color: colors.onLime, letterSpacing: -0.3 },
  footerHost: { fontFamily: fonts.semi, fontSize: 13, color: 'rgba(10,10,13,0.7)' }
})
