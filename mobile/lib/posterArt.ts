// Generated poster colours: every film gets a gradient from its genre, nudged by its id so neighbours differ.
const GENRE_GRADIENTS: Record<string, [string, string]> = {
  Romance: ['#FF4F9A', '#FF9A6B'],
  Comedy: ['#FFC53D', '#FF6B3D'],
  Horror: ['#3B0A12', '#D7263D'],
  Thriller: ['#14213D', '#E63946'],
  Crime: ['#191919', '#C9A227'],
  Mystery: ['#1B1F3B', '#8B6CFF'],
  Drama: ['#23246B', '#8B6CFF'],
  'Sci-Fi': ['#071E3D', '#45D6FF'],
  'Science Fiction': ['#071E3D', '#45D6FF'],
  Fantasy: ['#3A0CA3', '#F72585'],
  Animation: ['#05A87F', '#C6F432'],
  Family: ['#3BA7F0', '#FFD23F'],
  Action: ['#FF5A1F', '#6A1FB8'],
  Adventure: ['#0B6E4F', '#F4A261'],
  War: ['#3F4532', '#A68A64'],
  Western: ['#6F3D1B', '#E9C46A'],
  Musical: ['#B5179E', '#FFD23F'],
  Documentary: ['#2F3350', '#7DBA9A']
}
const FALLBACK: [string, string] = ['#2A2A35', '#6B6B80']

// Diagonal directions for expo-linear-gradient start/end.
const DIRECTIONS = [
  { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
  { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } },
  { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } }
]

export function posterArt(film: { id: number; genres?: string[] }) {
  const colors = GENRE_GRADIENTS[film.genres?.[0] || ''] || FALLBACK
  const direction = DIRECTIONS[Math.abs(film.id) % DIRECTIONS.length]
  return { colors, ...direction }
}

// Title size for a poster of the given width: shrinks for long titles, and never so big that the longest
// word has to break mid-word (display glyphs average ~0.62em wide).
export function posterTitleSize(title: string, width: number, padding = 20) {
  const inner = Math.max(40, width - padding * 2)
  const longestWord = Math.max(1, ...title.split(/\s+/).map((word) => word.length))
  const byWord = inner / (longestWord * 0.62)
  const base = width / 6.2
  const factor = title.length > 34 ? 0.55 : title.length > 22 ? 0.68 : title.length > 12 ? 0.82 : 1
  return Math.round(Math.max(11, Math.min(base * factor, byWord)))
}
