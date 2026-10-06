import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { FeedbackSheet } from '../components/FeedbackSheet'
import { Button, Card, Chip, SectionTitle, Tag } from '../components/ui'
import { apiFetch } from '../lib/api'
import { useAuth } from '../lib/auth'
import { haptic } from '../lib/haptics'
import { GENDER_OPTIONS, WEB_URL, defaultInterestedIn, toggleInList } from '../lib/profileOptions'
import { colors, fonts, radii, type } from '../lib/theme'
import type { Gender } from '../lib/types'

function Row({ icon, title, subtitle, right, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void }) {
  const content = (
    <>
      <Ionicons name={icon} size={20} color={colors.soft} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={type.small}>{subtitle}</Text>}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null)}
    </>
  )
  if (!onPress) return <View style={styles.row}>{content}</View>
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} accessibilityRole="button">
      {content}
    </Pressable>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { user, refreshUser, signOut } = useAuth()
  const [gender, setGender] = useState<Gender | null>(user?.gender === 'other' ? 'nonbinary' : (user?.gender as Gender | null) ?? null)
  const [interestedIn, setInterestedIn] = useState<Gender[]>(user?.interested_in || [])
  const [minAge, setMinAge] = useState(String(user?.discovery_prefs?.minAge || 18))
  const [maxAge, setMaxAge] = useState(String(user?.discovery_prefs?.maxAge || 99))
  const [minScore, setMinScore] = useState(user?.discovery_prefs?.minScore ? String(user.discovery_prefs.minScore) : '')
  const [needIdentity, setNeedIdentity] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  if (!user) return null
  const datingOn = user.dating_enabled !== false

  async function update(body: Record<string, unknown>, success?: string) {
    setSaving(true)
    try {
      await apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(body) })
      await refreshUser()
      haptic.success()
      if (success) Alert.alert(success)
      return true
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again')
      return false
    } finally {
      setSaving(false)
    }
  }

  function chooseFilmsOnly() {
    if (!datingOn) return
    Alert.alert('Pause dating?', "You'll leave the dating deck. Your matches and chats stay, and you can switch back anytime.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pause dating', onPress: () => update({ datingEnabled: false }) }
    ])
  }

  function chooseDating() {
    if (datingOn) return
    if (!user?.gender) {
      setNeedIdentity(true)
      return
    }
    update({ datingEnabled: true })
  }

  async function savePreferences() {
    if (!gender) return Alert.alert('Choose how you identify')
    if (!interestedIn.length) return Alert.alert('Show me', 'Choose at least one group you would like to meet.')
    const ok = await update({
      gender,
      interestedIn,
      ...(needIdentity ? { datingEnabled: true } : {}),
      discoveryPrefs: {
        minAge: Number(minAge) || 18,
        maxAge: Number(maxAge) || 99,
        countries: user?.discovery_prefs?.countries || [],
        minScore: Math.min(95, Math.max(0, Number(minScore) || 0))
      }
    }, needIdentity ? undefined : 'Preferences saved')
    if (ok) setNeedIdentity(false)
  }

  async function setTasteCardPublic(isPublic: boolean) {
    try {
      await apiFetch('/users/taste-card', { method: 'PUT', body: JSON.stringify({ public: isPublic }) })
      await refreshUser()
    } catch (err) {
      Alert.alert('Could not update', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function requestEmailVerify() {
    try {
      const data = await apiFetch<{ alreadyVerified?: boolean; devVerifyUrl?: string }>('/auth/verify-email/request', { method: 'POST' })
      Alert.alert(data.alreadyVerified ? 'Already verified' : 'Check your email', data.devVerifyUrl ? `Mail isn't configured here. Open:\n${data.devVerifyUrl}` : data.alreadyVerified ? '' : 'We sent you a verification link.')
    } catch (err) {
      Alert.alert('Could not send email', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function requestVerification() {
    try {
      await apiFetch('/users/verification/request', { method: 'POST', body: JSON.stringify({ notes: 'Requested from Settings' }) })
      await refreshUser()
      Alert.alert('Request sent', 'Our team will review your profile.')
    } catch (err) {
      Alert.alert('Could not submit', err instanceof Error ? err.message : 'Try again')
    }
  }

  function deleteAccount() {
    Alert.alert('Delete account', 'This permanently deletes your profile, photos, ratings, matches and messages. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/safety/account', { method: 'DELETE' })
          } catch (err) {
            Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Try again')
            return
          }
          await signOut()
          router.replace('/welcome')
        }
      }
    ])
  }

  const showPrefs = datingOn || needIdentity
  const verification =
    user.verification_status === 'verified' ? 'Verified' : user.verification_status === 'pending' ? 'Under review' : 'Not verified'

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionTitle title="Here for" />
      <View style={styles.hereRow}>
        <Pressable style={[styles.here, !datingOn && !needIdentity && styles.hereOn]} onPress={chooseFilmsOnly} accessibilityRole="radio" accessibilityState={{ selected: !datingOn }}>
          <Text style={styles.hereEmoji}>🍿</Text>
          <Text style={styles.hereTitle}>Films & friends</Text>
        </Pressable>
        <Pressable style={[styles.here, (datingOn || needIdentity) && styles.hereOn]} onPress={chooseDating} accessibilityRole="radio" accessibilityState={{ selected: datingOn }}>
          <Text style={styles.hereEmoji}>💘</Text>
          <Text style={styles.hereTitle}>Dating too</Text>
        </Pressable>
      </View>

      {showPrefs && (
        <>
          <SectionTitle title={needIdentity ? 'Set up dating' : 'Dating preferences'} />
          <Card>
            <Text style={type.label}>I am a</Text>
            <View style={styles.chips}>
              {GENDER_OPTIONS.map(({ value, label }) => (
                <Chip key={value} label={label} selected={gender === value} onPress={() => {
                  setGender(value)
                  if (!interestedIn.length) setInterestedIn(defaultInterestedIn(value))
                }} accessibilityRole="radio" />
              ))}
            </View>
            <Text style={type.label}>Show me</Text>
            <View style={styles.chips}>
              {GENDER_OPTIONS.map(({ value, plural }) => (
                <Chip key={value} label={plural} selected={interestedIn.includes(value)} onPress={() => setInterestedIn((list) => toggleInList(list, value))} accessibilityRole="checkbox" />
              ))}
            </View>
            <Text style={type.label}>Age range</Text>
            <View style={styles.ageRow}>
              <TextInput style={styles.ageInput} value={minAge} onChangeText={setMinAge} keyboardType="number-pad" maxLength={3} accessibilityLabel="Minimum age" />
              <Text style={type.small}>to</Text>
              <TextInput style={styles.ageInput} value={maxAge} onChangeText={setMaxAge} keyboardType="number-pad" maxLength={3} accessibilityLabel="Maximum age" />
            </View>
            <View style={styles.plusRow}>
              <Text style={type.label}>Minimum taste match</Text>
              {!user.plus?.active && <Tag label="Plus" tone="orange" icon="star" />}
            </View>
            {user.plus?.active ? (
              <TextInput style={styles.ageInput} value={minScore} onChangeText={setMinScore} keyboardType="number-pad" placeholder="e.g. 70" placeholderTextColor={colors.faint} maxLength={2} accessibilityLabel="Minimum taste match percent" />
            ) : (
              <Text style={type.small}>With Plus, only see people above a match % you choose, and see everyone who already liked you.</Text>
            )}
            <Button title={needIdentity ? 'Turn on dating' : 'Save preferences'} size="md" loading={saving} onPress={savePreferences} />
          </Card>
        </>
      )}

      <SectionTitle title="Privacy" />
      <Card style={styles.group}>
        <Row
          icon="globe-outline"
          title="Public taste card"
          subtitle="Anyone with your link sees your first name, favourite, rarest likes and top genres. Never your photo, age or location."
          right={<Switch value={Boolean(user.taste_card_public)} onValueChange={setTasteCardPublic} trackColor={{ true: colors.lime, false: colors.cardHigh }} thumbColor="#fff" />}
        />
      </Card>

      <SectionTitle title="Account" />
      <Card style={styles.group}>
        <Row
          icon="people-outline"
          title="Your friend code"
          subtitle={user.referral_code || '…'}
          right={
            <Button title="Share" size="sm" variant="secondary" disabled={!user.referral_code} onPress={() => Share.share({ message: `Add me on ReelMates with code ${user.referral_code} and see how our film taste matches 🎬 ${WEB_URL}` }).catch(() => null)} />
          }
        />
        <Row
          icon="mail-outline"
          title="Email"
          subtitle={user.email}
          right={user.email_verified ? <Tag label="Verified" tone="green" icon="checkmark" /> : <Button title="Verify" size="sm" variant="secondary" onPress={requestEmailVerify} />}
        />
        <Row
          icon="shield-checkmark-outline"
          title="Profile verification"
          subtitle={verification}
          right={user.verification_status === 'verified' || user.verification_status === 'pending' ? undefined : <Button title="Request" size="sm" variant="secondary" onPress={requestVerification} />}
        />
      </Card>

      <SectionTitle title="Support" />
      <Card style={styles.group}>
        <Row icon="chatbox-ellipses-outline" title="Send feedback" onPress={() => setFeedbackOpen(true)} />
        <Row icon="document-text-outline" title="Privacy Policy" onPress={() => Linking.openURL(String(Constants.expoConfig?.extra?.privacyPolicyUrl))} />
        <Row icon="reader-outline" title="Terms of Service" onPress={() => Linking.openURL(String(Constants.expoConfig?.extra?.termsUrl))} />
        <Row icon="help-buoy-outline" title="Contact support" onPress={() => Linking.openURL(`mailto:${Constants.expoConfig?.extra?.supportEmail}`)} />
      </Card>

      <Button
        title="Log out"
        variant="secondary"
        icon="log-out-outline"
        onPress={async () => {
          await signOut()
          router.replace('/welcome')
        }}
      />
      <Button title="Delete account" variant="danger" onPress={deleteAccount} />
      <Text style={styles.version}>ReelMates {Constants.expoConfig?.version}</Text>
      <FeedbackSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  hereRow: { flexDirection: 'row', gap: 10 },
  here: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 18 },
  hereOn: { borderColor: colors.lime, backgroundColor: 'rgba(212,255,63,0.07)' },
  hereEmoji: { fontSize: 30 },
  hereTitle: { fontFamily: fonts.bold, color: colors.text, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ageInput: { backgroundColor: colors.cardHigh, borderRadius: radii.sm, color: colors.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, minWidth: 72, textAlign: 'center' },
  plusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  group: { padding: 6, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 12 },
  rowTitle: { fontFamily: fonts.semi, color: colors.text, fontSize: 15 },
  version: { color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: 8 }
})
