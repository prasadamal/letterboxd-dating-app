export const colors = {
  bg: '#07080d',
  bgElevated: '#0d1018',
  card: 'rgba(18, 22, 30, 0.82)',
  cardSolid: '#12161e',
  border: 'rgba(255,255,255,0.09)',
  glass: 'rgba(255,255,255,0.04)',
  text: '#f4f8ff',
  muted: '#9fb0c3',
  soft: '#dfe9ff',
  pink: '#ff5f8a',
  purple: '#a56bff',
  peach: '#ffb38d',
  green: '#5ee4a8',
  error: '#ff8da6',
  gradientStart: '#ff5f8a',
  gradientEnd: '#a56bff'
}

export const typography = {
  hero: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 11, letterSpacing: 1.2, fontWeight: '700' as const }
}

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  }
}
