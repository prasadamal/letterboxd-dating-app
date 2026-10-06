import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { posterArt, posterTitleSize } from '../../lib/posterArt'
import { fonts } from '../../lib/theme'

type Film = { id: number; title: string; year?: number | null; genres?: string[]; origin_language?: string }

// Typographic poster: a genre gradient, the year up top and the title set big, like a minimalist one-sheet.
export function Poster({
  film,
  width,
  height,
  variant = 'full',
  style
}: {
  film: Film
  width: number
  height?: number
  variant?: 'full' | 'thumb'
  style?: StyleProp<ViewStyle>
}) {
  const art = posterArt(film)
  const h = height ?? Math.round(width * 1.45)
  if (variant === 'thumb') {
    return (
      <LinearGradient colors={art.colors} start={art.start} end={art.end} style={[styles.thumb, { width, height: h, borderRadius: Math.round(width * 0.2) }, style]}>
        <Text selectable={false} style={[styles.thumbLetter, { fontSize: Math.round(width * 0.42) }]} numberOfLines={1}>
          {film.title.replace(/^(The|A|An) /i, '').charAt(0).toUpperCase()}
        </Text>
      </LinearGradient>
    )
  }
  // Small posters (e.g. the welcome wall) drop the brand mark and the language, and scale the type down.
  const small = width < 180
  const padding = small ? 12 : 20
  const titleSize = posterTitleSize(film.title, width, padding)
  const meta = (small ? [film.genres?.[0]] : [film.genres?.[0], film.origin_language]).filter(Boolean).join(' · ')
  return (
    <LinearGradient colors={art.colors} start={art.start} end={art.end} style={[styles.poster, { width, height: h, padding }, style]}>
      <View style={styles.topRow}>
        <Text selectable={false} style={[styles.year, small && styles.yearSmall]}>{film.year || ''}</Text>
        {!small && <Text selectable={false} style={styles.brand}>REELMATES</Text>}
      </View>
      {/* Oversized faint year as texture. */}
      <Text selectable={false} style={[styles.watermark, { fontSize: Math.round(width * 0.42) }]} numberOfLines={1}>
        {String(film.year || '').slice(-2)}
      </Text>
      <View style={[styles.bottom, small && { gap: 4 }]}>
        <Text selectable={false} style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.04) }]} numberOfLines={4}>
          {film.title}
        </Text>
        {!!meta && <Text selectable={false} style={[styles.meta, small && styles.metaSmall]} numberOfLines={1}>{meta.toUpperCase()}</Text>}
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  poster: { borderRadius: 28, padding: 20, justifyContent: 'space-between', overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  year: { fontFamily: fonts.bold, color: 'rgba(255,255,255,0.92)', fontSize: 16, letterSpacing: 1 },
  yearSmall: { fontSize: 11, letterSpacing: 0.5 },
  brand: { fontFamily: fonts.semi, color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: 2.5 },
  watermark: { position: 'absolute', right: -8, top: '28%', fontFamily: fonts.display, color: 'rgba(255,255,255,0.10)', letterSpacing: -6 },
  bottom: { gap: 10 },
  title: { fontFamily: fonts.display, color: '#fff', letterSpacing: -1 },
  meta: { fontFamily: fonts.semi, color: 'rgba(255,255,255,0.8)', fontSize: 12, letterSpacing: 1.6 },
  metaSmall: { fontSize: 8, letterSpacing: 0.8 },
  thumb: { alignItems: 'center', justifyContent: 'center' },
  thumbLetter: { fontFamily: fonts.display, color: 'rgba(255,255,255,0.92)' }
})
