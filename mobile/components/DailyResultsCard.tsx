import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Share, StyleSheet, Text, View } from 'react-native'
import { haptic } from '../lib/haptics'
import { colors, fonts, radii, type } from '../lib/theme'
import type { DailyResults } from '../lib/types'
import { Button, Poster } from './ui'

const VOTE_ICON = {
  love: { name: 'heart' as const, color: colors.pink },
  hate: { name: 'close' as const, color: colors.red },
  skip: { name: 'eye-off' as const, color: colors.cyan }
}

// Time until the next UTC midnight, when everyone's new films arrive.
function untilNextDrop(now = new Date()) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const minutes = Math.max(0, Math.round((next - now.getTime()) / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export function DailyResultsCard({ results }: { results: DailyResults }) {
  const [countdown, setCountdown] = useState(untilNextDrop())
  useEffect(() => {
    const timer = setInterval(() => setCountdown(untilNextDrop()), 30000)
    return () => clearInterval(timer)
  }, [])

  const agreement = results.comparable ? Math.round((results.agreed / results.comparable) * 100) : null

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View>
          <Text style={type.label}>Daily #{results.number}</Text>
          <Text style={[type.h2, { marginTop: 2 }]}>{results.complete ? "Today's verdicts are in" : 'Your verdicts so far'}</Text>
        </View>
        {results.streak.current > 0 && (
          <View style={styles.streak}>
            <Text style={styles.streakText}>🔥 {results.streak.current}</Text>
          </View>
        )}
      </View>

      {agreement !== null && (
        <View style={styles.agreeRow}>
          <Text style={styles.agreeValue}>{agreement}%</Text>
          <Text style={[type.small, { flex: 1 }]}>
            in sync with the crowd ({results.agreed} of {results.comparable} films).{' '}
            {agreement >= 70 ? 'Certified crowd-pleaser.' : agreement <= 35 ? 'Proud contrarian 🌶️' : 'Nicely balanced.'}
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        {results.films.map((film) => {
          const vote = film.myRating ? VOTE_ICON[film.myRating] : null
          return (
            <View key={film.id} style={styles.tile} accessible accessibilityLabel={`${film.title}: ${film.likedPercent ?? 0}% liked it`}>
              <Poster film={film} width={56} height={78} variant="thumb" />
              {vote && (
                <View style={[styles.vote, { backgroundColor: vote.color }]}>
                  <Ionicons name={vote.name} size={11} color="#fff" />
                </View>
              )}
              <Text style={styles.tilePct}>{film.likedPercent == null ? '–' : `${film.likedPercent}%`}</Text>
            </View>
          )
        })}
      </View>
      <Text style={styles.gridHint}>% of everyone who liked each film</Text>

      {(results.mostDivisive || results.crowdFavourite) && (
        <View style={styles.facts}>
          {results.crowdFavourite && (
            <Text style={styles.fact}>
              🏆 Crowd favourite: <Text style={styles.factStrong}>{results.crowdFavourite.title}</Text> ({results.crowdFavourite.likedPercent}%)
            </Text>
          )}
          {results.mostDivisive && results.mostDivisive.id !== results.crowdFavourite?.id && (
            <Text style={styles.fact}>
              ⚔️ Most divisive: <Text style={styles.factStrong}>{results.mostDivisive.title}</Text> ({results.mostDivisive.likedPercent}%)
            </Text>
          )}
        </View>
      )}

      <Button
        title="Share my results"
        icon="share-social"
        onPress={() => {
          haptic.tap()
          Share.share({ message: results.shareText }).catch(() => null)
        }}
      />
      <Text style={styles.next}>New films in {countdown}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  streak: { backgroundColor: 'rgba(255,138,61,0.16)', borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { fontFamily: fonts.bold, color: colors.orange, fontSize: 15 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agreeValue: { fontFamily: fonts.display, fontSize: 40, color: colors.lime, letterSpacing: -1.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  tile: { width: '18%', alignItems: 'center', gap: 4 },
  vote: { position: 'absolute', top: -4, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
  tilePct: { fontFamily: fonts.semi, color: colors.soft, fontSize: 12 },
  gridHint: { color: colors.faint, fontSize: 11, textAlign: 'center', marginTop: -6 },
  facts: { gap: 6 },
  fact: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  factStrong: { color: colors.text, fontWeight: '700' },
  next: { color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: -4 }
})
