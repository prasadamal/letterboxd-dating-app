import { useCallback, useEffect, useState } from 'react'
import { Share, StyleSheet, Text, View } from 'react-native'
import { apiFetch, ApiError } from '../lib/api'
import { colors, fonts, radii } from '../lib/theme'
import { Button } from './ui'

type Response = { id: string; name: string; score: number; same: number }
type MyChallenge = { code: string; url: string; shareText: string; responses: Response[] }

// After today's ten: send a link anyone can answer (no app needed) and see how connected you are.
export function ChallengeFriend() {
  const [challenge, setChallenge] = useState<MyChallenge | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    apiFetch<{ challenge: MyChallenge | null }>('/challenges/today')
      .then((data) => setChallenge(data.challenge))
      .catch(() => null)
  }, [])
  useEffect(load, [load])

  const share = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await apiFetch<{ challenge: MyChallenge }>('/challenges', { method: 'POST' })
      setChallenge((prev) => ({ ...data.challenge, responses: prev?.responses || [] }))
      await Share.share({ message: data.challenge.shareText })
      load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not make the link. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const responses = challenge?.responses || []
  return (
    <View style={styles.box}>
      <Text style={styles.title}>How connected are you with a friend?</Text>
      <Text style={styles.body}>
        {"Send today's ten as a link: WhatsApp, Instagram, Telegram, anywhere. They rate the same films, no app needed, and you both see your connection."}
      </Text>
      <Button
        title={challenge ? 'Share my challenge again' : 'Challenge a friend'}
        icon="people"
        variant="secondary"
        loading={busy}
        onPress={share}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {responses.length > 0 && (
        <View style={styles.list} accessibilityLabel={`${responses.length} people answered your challenge`}>
          {responses.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={styles.meta}>{r.same}/10 same</Text>
              <Text style={styles.score}>{r.score}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: { gap: 10, padding: 14, borderRadius: radii.lg, backgroundColor: colors.cardHigh },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.text, letterSpacing: -0.4 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.red, fontSize: 13 },
  list: { gap: 8, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, color: colors.text, fontFamily: fonts.semi, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12 },
  score: { fontFamily: fonts.display, color: colors.lime, fontSize: 18, minWidth: 48, textAlign: 'right' }
})
