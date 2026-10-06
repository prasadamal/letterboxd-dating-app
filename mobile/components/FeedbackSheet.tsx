import { useState } from 'react'
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Constants from 'expo-constants'
import { apiFetch } from '../lib/api'
import { colors, fonts } from '../lib/theme'

const CATEGORIES = [
  { value: 'idea', label: 'Idea' },
  { value: 'bug', label: 'Something broke' },
  { value: 'film', label: 'Missing film' },
  { value: 'other', label: 'Other' }
] as const

type Props = { visible: boolean; onClose: () => void }

export function FeedbackSheet({ visible, onClose }: Props) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('idea')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function send() {
    if (message.trim().length < 3) return
    setSending(true)
    setError('')
    try {
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({
          category,
          message: message.trim(),
          appVersion: Constants.expoConfig?.version,
          platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web'
        })
      })
      setStatus('sent')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  function close() {
    setStatus('idle')
    setError('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Send feedback</Text>
          {status === 'sent' ? (
            <>
              <Text style={styles.sub}>Thank you — we read every message.</Text>
              <Pressable style={styles.primary} onPress={close}>
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sub}>Ideas, bugs, a film we should add — tell us anything.</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c.value} style={[styles.chip, category === c.value && styles.chipOn]} onPress={() => setCategory(c.value)}>
                    <Text style={[styles.chipText, category === c.value && styles.chipTextOn]}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder={category === 'film' ? 'Which film (and year)?' : 'Your message'}
                placeholderTextColor={colors.muted}
                multiline
                maxLength={2000}
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={[styles.primary, (sending || message.trim().length < 3) && { opacity: 0.5 }]}
                disabled={sending || message.trim().length < 3}
                onPress={send}
              >
                {sending ? <ActivityIndicator color={colors.onLime} /> : <Text style={styles.primaryText}>Send</Text>}
              </Pressable>
              <Pressable style={styles.cancel} onPress={close}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 10, borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.display, color: colors.text, fontSize: 24, letterSpacing: -0.5 },
  sub: { color: colors.muted, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextOn: { color: colors.onLime },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, minHeight: 110, textAlignVertical: 'top' },
  error: { color: colors.error },
  primary: { backgroundColor: colors.lime, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  primaryText: { fontFamily: fonts.bold, color: colors.onLime, fontSize: 16 },
  cancel: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: colors.muted }
})
