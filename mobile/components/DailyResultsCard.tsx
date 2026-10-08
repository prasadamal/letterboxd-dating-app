import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '../lib/api'
import { haptic } from '../lib/haptics'
import { colors, fonts, radii, type } from '../lib/theme'
import type { DailyResults, Personality } from '../lib/types'
import { DailyStory, ShareImageSheet } from './ShareImageSheet'
import { Button, Poster } from './ui'

const VOTE = {
  love: { icon: 'heart' as const, color: colors.pink, label: 'You loved it' },
  hate: { icon: 'close' as const, color: colors.red, label: "You didn't like it" },
  skip: { icon: 'eye-off' as const, color: colors.cyan, label: "You haven't seen it" }
}

// Time until the next UTC midnight, when everyone's new films arrive.
function untilNextDrop(now = new Date()) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const minutes = Math.max(0, Math.round((next - now.getTime()) / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

// Today's films as a receipt: your verdict, the film, and how many people liked it.
export function DailyResultsCard({ results, streak }: { results: DailyResults; streak?: number }) {
  const [countdown, setCountdown] = useState(untilNextDrop())
  const [sharing, setSharing] = useState(false)
  const [personality, setPersonality] = useState<Personality | null>(null)
  useEffect(() => {
    const timer = setInterval(() => setCountdown(untilNextDrop()), 30000)
    return () => clearInterval(timer)
  }, [])

  const agreement = results.comparable ? Math.round((results.agreed / results.comparable) * 100) : null

  return (
    <View style={styles.card}>
      <Text style={type.h2}>{results.complete ? "Today's verdicts are in" : 'Your verdicts so far'}</Text>

      {agreement !== null && (
        <View style={styles.agreeRow}>
          <Text style={styles.agreeValue}>{agreement}%</Text>
          <Text style={[type.small, { flex: 1 }]}>
            in sync with the crowd ({results.agreed} of {results.comparable} films).{' '}
            {agreement >= 70 ? 'Certified crowd-pleaser.' : agreement <= 35 ? 'Proud contrarian 🌶️' : 'Nicely balanced.'}
          </Text>
        </View>
      )}

      <View style={styles.list}>
        {results.films.map((film) => {
          const vote = film.myRating ? VOTE[film.myRating] : null
          const pct = film.likedPercent
          return (
            <View key={film.id} style={styles.row} accessible accessibilityLabel={`${film.title}. ${vote?.label ?? 'Not rated'}. ${pct ?? 0}% liked it.`}>
              <Poster film={film} width={30} height={40} variant="thumb" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {film.title}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct ?? 0}%` }]} />
                </View>
              </View>
              <Text style={styles.pct}>{pct == null ? '–' : `${pct}%`}</Text>
              <View style={[styles.vote, { backgroundColor: vote ? vote.color : colors.cardHigh }]}>
                {vote && <Ionicons name={vote.icon} size={13} color="#fff" />}
              </View>
            </View>
          )
        })}
      </View>
      <Text style={styles.hint}>Bars show how many people liked each film</Text>

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
          setSharing(true)
          // The story shows your film personality too, when you have one.
          apiFetch<{ stats: { personality?: Personality } }>('/users/taste-stats')
            .then((d) => setPersonality(d.stats.personality?.ready ? d.stats.personality : null))
            .catch(() => null)
        }}
      />
      <ShareImageSheet visible={sharing} onClose={() => setSharing(false)} title="Share today’s results" fallbackText={results.shareText}>
        <DailyStory results={results} personality={personality} streak={streak} />
      </ShareImageSheet>
      <Text style={styles.next}>New films in {countdown}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agreeValue: { fontFamily: fonts.display, fontSize: 40, color: colors.lime, letterSpacing: -1.5 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.semi, color: colors.text, fontSize: 14 },
  barTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: colors.lime },
  pct: { fontFamily: fonts.bold, color: colors.soft, fontSize: 13, width: 40, textAlign: 'right' },
  vote: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.faint, fontSize: 11, textAlign: 'center', marginTop: -4 },
  facts: { gap: 6 },
  fact: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  factStrong: { color: colors.text, fontWeight: '700' },
  next: { color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: -4 }
})
