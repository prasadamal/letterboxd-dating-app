import type { TextStyle } from 'react-native'

// ReelMates design tokens. Dark, high-contrast, one loud accent (marquee lime) and a few vivid supporting
// colours. Legacy names (accent, peach, purple, highlight, error) map onto the new palette for older components.
export const colors = {
  bg: '#08080B',
  bgElevated: '#101015',
  card: '#15151C',
  cardHigh: '#1D1D26',
  cardGlass: 'rgba(21, 21, 28, 0.88)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#F7F7FA',
  soft: '#D9D9E3',
  muted: '#9C9CAD',
  faint: '#6B6B7D',

  lime: '#D4FF3F', // primary actions; always with dark text (onLime)
  onLime: '#0A0A0D',
  pink: '#FF4F9A', // like / love
  violet: '#8B6CFF',
  cyan: '#45D6FF',
  orange: '#FF8A3D', // streaks
  red: '#FF5C6C', // nope / danger
  green: '#3DDC97',
  gold: '#FFD23F',

  accent: '#D4FF3F',
  peach: '#FFB27A',
  purple: '#8B6CFF',
  highlight: '#FFD23F',
  error: '#FF5C6C'
}

export const gradients = {
  brand: ['#D4FF3F', '#45D6FF'] as const,
  love: ['#FF4F9A', '#FF8A3D'] as const,
  night: ['#1D1D26', '#08080B'] as const,
  violet: ['#8B6CFF', '#FF4F9A'] as const
}

// Bricolage Grotesque for display text (loaded in app/_layout.tsx); the system font for body copy.
export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  bold: 'BricolageGrotesque_700Bold',
  semi: 'BricolageGrotesque_600SemiBold',
  medium: 'BricolageGrotesque_500Medium'
}

// Never combine fontFamily with fontWeight: Android drops custom families when both are set.
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -1.4, color: colors.text },
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, letterSpacing: -1, color: colors.text },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: colors.text },
  h3: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 23, letterSpacing: -0.2, color: colors.text },
  label: { fontFamily: fonts.semi, fontSize: 12, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.muted },
  body: { fontSize: 15, lineHeight: 22, color: colors.soft },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  button: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: -0.1 },
  number: { fontFamily: fonts.display, letterSpacing: -1, color: colors.text }
} satisfies Record<string, TextStyle>

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
export const radii = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 }
