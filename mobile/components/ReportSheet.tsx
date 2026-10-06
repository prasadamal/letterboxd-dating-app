import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { apiFetch } from '../lib/api'
import { colors, fonts } from '../lib/theme'

// Must match the reasons the API (and the reports table) accept.
const REASONS = [
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'inappropriate', label: 'Inappropriate photo or message' },
  { value: 'fake_profile', label: 'Fake profile or underage' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' }
] as const

type Props = {
  visible: boolean
  userId: string
  userName?: string
  onClose: () => void
  onReported: (blocked: boolean) => void
}

export function ReportSheet({ visible, userId, userName, onClose, onReported }: Props) {
  const [reason, setReason] = useState<(typeof REASONS)[number]['value'] | null>(null)
  const [details, setDetails] = useState('')
  const [block, setBlock] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setReason(null)
    setDetails('')
    setBlock(true)
    setError('')
  }

  async function submit() {
    if (!reason) return
    setSending(true)
    setError('')
    try {
      await apiFetch('/safety/report', {
        method: 'POST',
        body: JSON.stringify({ userId, reason, details: details.trim() || undefined, block })
      })
      reset()
      onReported(block)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send report')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Report {userName || 'this person'}</Text>
          <Text style={styles.sub}>Reports are confidential. Our team reviews every report within 24 hours.</Text>
          {REASONS.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.option, reason === item.value && styles.optionOn]}
              onPress={() => setReason(item.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === item.value }}
            >
              <Text style={styles.optionText}>{item.label}</Text>
            </Pressable>
          ))}
          <TextInput
            style={styles.input}
            value={details}
            onChangeText={setDetails}
            placeholder="Anything else we should know? (optional)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
          />
          <Pressable style={styles.blockRow} onPress={() => setBlock((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: block }}>
            <View style={[styles.checkbox, block && styles.checkboxOn]} />
            <Text style={styles.optionText}>Also block — you won't see each other again</Text>
          </Pressable>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={[styles.primary, (!reason || sending) && { opacity: 0.5 }]} disabled={!reason || sending} onPress={submit}>
            {sending ? <ActivityIndicator color={colors.onLime} /> : <Text style={styles.primaryText}>Send report</Text>}
          </Pressable>
          <Pressable
            style={styles.cancel}
            onPress={() => {
              reset()
              onClose()
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 8, borderWidth: 1, borderColor: colors.border },
  title: { fontFamily: fonts.display, color: colors.text, fontSize: 24, letterSpacing: -0.5 },
  sub: { color: colors.muted, marginBottom: 6 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  optionOn: { borderColor: colors.lime, backgroundColor: 'rgba(212,255,63,0.08)' },
  optionText: { color: colors.text, flexShrink: 1 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, minHeight: 64, textAlignVertical: 'top' },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  checkboxOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  error: { color: colors.error },
  primary: { backgroundColor: colors.lime, borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryText: { fontFamily: fonts.bold, color: colors.onLime, fontSize: 16 },
  cancel: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: colors.muted }
})
