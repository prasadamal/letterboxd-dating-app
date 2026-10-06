import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Poster } from '../components/ui'
import { colors, fonts, type } from '../lib/theme'

// A few films from the catalog for the moving poster wall.
const ROWS = [
  [
    { id: 1, title: 'Parasite', year: 2019, genres: ['Thriller'], origin_language: 'Korean' },
    { id: 2, title: 'Spirited Away', year: 2001, genres: ['Animation'], origin_language: 'Japanese' },
    { id: 3, title: 'Kumbalangi Nights', year: 2019, genres: ['Drama'], origin_language: 'Malayalam' },
    { id: 4, title: 'Amélie', year: 2001, genres: ['Romance'], origin_language: 'French' },
    { id: 5, title: 'Get Out', year: 2017, genres: ['Horror'], origin_language: 'English' }
  ],
  [
    { id: 6, title: 'Interstellar', year: 2014, genres: ['Sci-Fi'], origin_language: 'English' },
    { id: 7, title: 'Before Sunrise', year: 1995, genres: ['Romance'], origin_language: 'English' },
    { id: 8, title: 'Mad Max: Fury Road', year: 2015, genres: ['Action'], origin_language: 'English' },
    { id: 9, title: 'Drishyam', year: 2013, genres: ['Crime'], origin_language: 'Malayalam' },
    { id: 10, title: 'Paddington 2', year: 2017, genres: ['Comedy'], origin_language: 'English' }
  ],
  [
    { id: 11, title: 'In the Mood for Love', year: 2000, genres: ['Romance'], origin_language: 'Cantonese' },
    { id: 12, title: 'La La Land', year: 2016, genres: ['Musical'], origin_language: 'English' },
    { id: 13, title: "Pan's Labyrinth", year: 2006, genres: ['Fantasy'], origin_language: 'Spanish' },
    { id: 14, title: 'Whiplash', year: 2014, genres: ['Drama'], origin_language: 'English' },
    { id: 15, title: 'The Godfather', year: 1972, genres: ['Crime'], origin_language: 'English' }
  ]
]

const POSTER_W = 104
const POSTER_H = 150
const GAP = 10

function PosterRow({ films, reverse, duration }: { films: (typeof ROWS)[number]; reverse: boolean; duration: number }) {
  const x = useRef(new Animated.Value(0)).current
  const stripWidth = films.length * (POSTER_W + GAP)
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [x, duration])
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: reverse ? [-stripWidth, 0] : [0, -stripWidth] })
  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      {[...films, ...films, ...films].map((film, index) => (
        <Poster key={`${film.id}-${index}`} film={film} width={POSTER_W} height={POSTER_H} style={styles.wallPoster} />
      ))}
    </Animated.View>
  )
}

export default function Welcome() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const wallHeight = Math.round(Math.min(height * 0.5, 3 * (POSTER_H + GAP) + 60))

  return (
    <View style={styles.screen}>
      {/* The clip keeps a straight bottom edge under the tilted wall; the fade sits on top, untilted. */}
      <View style={[styles.wallClip, { height: wallHeight }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.wall}>
          {ROWS.map((films, i) => (
            <PosterRow key={i} films={films} reverse={i % 2 === 1} duration={38000 + i * 7000} />
          ))}
        </View>
        <LinearGradient colors={['rgba(8,8,11,0)', 'rgba(8,8,11,0.85)', colors.bg]} locations={[0, 0.65, 1]} style={[styles.fade, { height: wallHeight * 0.55 }]} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>R</Text>
          </View>
          <Text style={styles.logo}>ReelMates</Text>
        </View>
        <Text style={type.hero}>Find your film people.</Text>
        <Text style={[type.body, styles.sub]}>
          Swipe 10 films a day, discover your film personality, and match with friends (and dates) who get your taste.
        </Text>
        <Button title="Get started" icon="sparkles" onPress={() => router.push('/signup')} />
        <Button title="I already have an account" variant="ghost" onPress={() => router.push('/login')} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  wallClip: { overflow: 'hidden' },
  wall: { paddingTop: 54, gap: GAP, transform: [{ rotate: '-6deg' }, { scale: 1.12 }] },
  row: { flexDirection: 'row', gap: GAP },
  wallPoster: { borderRadius: 18, padding: 12 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  logoMarkText: { fontFamily: fonts.display, fontSize: 20, color: colors.onLime, marginTop: -1 },
  logo: { fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: -0.5 },
  sub: { color: colors.muted, marginBottom: 8 }
})
