import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '../../lib/theme'

const RING: [string, string] = ['#D4FF3F', '#45D6FF']
const INITIAL_BACKGROUNDS: [string, string][] = [
  ['#8B6CFF', '#FF4F9A'],
  ['#FF8A3D', '#FF4F9A'],
  ['#05A87F', '#45D6FF'],
  ['#3A0CA3', '#4CC9F0'],
  ['#FF5A1F', '#6A1FB8']
]

function initials(name?: string) {
  const parts = String(name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

// A real photo when there is one, otherwise initials on a colour picked from the name. Optional gradient ring.
export function Avatar({ uri, name, size = 48, ring = false }: { uri?: string | null; name?: string; size?: number; ring?: boolean }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(uri) && !failed && !String(uri).includes('dicebear')
  const inner = ring ? size - 6 : size
  const face = showPhoto ? (
    <Image
      source={{ uri: String(uri) }}
      onError={() => setFailed(true)}
      style={{ width: inner, height: inner, borderRadius: inner / 2, backgroundColor: colors.cardHigh }}
      accessibilityLabel={name ? `${name}'s photo` : 'Photo'}
    />
  ) : (
    <LinearGradient
      colors={INITIAL_BACKGROUNDS[hash(name || '?') % INITIAL_BACKGROUNDS.length]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.initials, { width: inner, height: inner, borderRadius: inner / 2 }]}
    >
      <Text style={[styles.initialsText, { fontSize: Math.round(inner * 0.38) }]} accessibilityLabel={name}>
        {initials(name)}
      </Text>
    </LinearGradient>
  )
  if (!ring) return face
  return (
    <LinearGradient colors={RING} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={{ padding: 2, borderRadius: size / 2, backgroundColor: colors.bg }}>{face}</View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  initials: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: fonts.display, color: '#fff', letterSpacing: -0.5 },
  ring: { alignItems: 'center', justifyContent: 'center', padding: 1 }
})
