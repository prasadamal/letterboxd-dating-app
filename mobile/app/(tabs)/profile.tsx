import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, Linking } from 'react-native'
import Constants from 'expo-constants'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'
import { FavoriteFilmPicker } from '../../components/FavoriteFilmPicker'
import { TasteStatsCard } from '../../components/TasteStatsCard'
import { FeedbackSheet } from '../../components/FeedbackSheet'
import { PromptsEditor } from '../../components/PromptsEditor'
import { GENDER_OPTIONS, WEB_URL, genderLabel, toggleInList } from '../../lib/profileOptions'
import type { Gender, ProfilePrompt } from '../../lib/types'

export default function ProfileScreen() {
  const { user, token, refreshUser, signOut } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user?.name || '')
  const [country, setCountry] = useState(user?.country || user?.city || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [ownReferral, setOwnReferral] = useState('')
  const [referralShare, setReferralShare] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [minAge, setMinAge] = useState(String(user?.discovery_prefs?.minAge || 18))
  const [maxAge, setMaxAge] = useState(String(user?.discovery_prefs?.maxAge || 99))
  const [gender, setGender] = useState<Gender>(user?.gender === 'other' || !user?.gender ? 'nonbinary' : user.gender)
  const [interestedIn, setInterestedIn] = useState<Gender[]>(user?.interested_in || [])
  const [prompts, setPrompts] = useState<ProfilePrompt[]>((user?.prompts || []).map(({ key, answer }) => ({ key, answer })))
  const [minScore, setMinScore] = useState(String(user?.discovery_prefs?.minScore || ''))

  useEffect(() => {
    if (!token) return
    apiFetch<{ code: string; shareMessage: string }>('/dating/referral', {}, token)
      .then((data) => {
        setOwnReferral(data.code)
        setReferralShare(data.shareMessage)
      })
      .catch(() => null)
  }, [token])

  if (!user) return null

  async function save() {
    if (!token) return
    if (!interestedIn.length) return Alert.alert('Show me', 'Choose at least one group you would like to meet.')
    setSaving(true)
    try {
      await apiFetch(
        '/users/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            name,
            country,
            bio,
            gender,
            interestedIn,
            prompts: prompts.filter((p) => p.answer.trim()),
            discoveryPrefs: {
              minAge: Number(minAge) || 18,
              maxAge: Number(maxAge) || 99,
              countries: user?.discovery_prefs?.countries || [],
              minScore: Math.min(95, Math.max(0, Number(minScore) || 0))
            }
          })
        },
        token
      )
      await refreshUser()
      Alert.alert('Saved', 'Your profile is up to date.')
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  async function applyReferral() {
    if (!token || !friendCode.trim()) return
    try {
      await apiFetch('/dating/referral/apply', { method: 'POST', body: JSON.stringify({ code: friendCode.trim() }) }, token)
      setFriendCode('')
      Alert.alert('Referral applied', 'Thanks for joining through a friend.')
    } catch (err) {
      Alert.alert('Could not apply code', err instanceof Error ? err.message : 'Try again')
    }
  }

  // Makes the public taste card visible at /taste/<code>, then opens the share sheet.
  async function shareTasteCard() {
    if (!token || !ownReferral) return
    try {
      if (!user?.taste_card_public) {
        await apiFetch('/users/taste-card', { method: 'PUT', body: JSON.stringify({ public: true }) }, token)
        await refreshUser()
      }
      const url = `${WEB_URL}/taste/${ownReferral}`
      await Share.share({ message: `How well does your film taste match mine? ${url}`, url })
    } catch (err) {
      Alert.alert('Could not share', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function hideTasteCard() {
    if (!token) return
    try {
      await apiFetch('/users/taste-card', { method: 'PUT', body: JSON.stringify({ public: false }) }, token)
      await refreshUser()
      Alert.alert('Taste card hidden', 'Your shared link no longer shows your taste.')
    } catch (err) {
      Alert.alert('Could not hide', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function pickPhoto() {
    if (!token) return
    // The system photo picker needs no library permission; a square crop keeps uploads well under the 2.5MB cap.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    })
    const asset = result.assets?.[0]
    if (result.canceled || !asset?.base64) return
    const contentType = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg'
    try {
      await apiFetch(
        '/users/avatar',
        { method: 'POST', body: JSON.stringify({ imageBase64: asset.base64, contentType }) },
        token
      )
      await refreshUser()
      Alert.alert('Photo saved', 'Your profile can now enter the dating deck once launch is open.')
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try a smaller photo')
    }
  }

  async function deleteAccount() {
    Alert.alert('Delete account', 'This permanently deletes your profile, photos, ratings, matches and messages. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/safety/account', { method: 'DELETE' }, token)
          } catch (err) {
            Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Try again')
            return
          }
          await signOut()
          router.replace('/login')
        }
      }
    ])
  }

  async function logout() {
    await signOut()
    router.replace('/login')
  }

  async function requestEmailVerify() {
    if (!token) return
    try {
      const data = await apiFetch<{ alreadyVerified?: boolean; devVerifyUrl?: string }>(
        '/auth/verify-email/request',
        { method: 'POST' },
        token
      )
      if (data.alreadyVerified) {
        Alert.alert('Already verified', 'This email is already confirmed.')
        return
      }
      Alert.alert(
        'Check your email',
        data.devVerifyUrl
          ? `Mail is not configured in this environment. Open this link:\n${data.devVerifyUrl}`
          : 'We sent a verification link.'
      )
    } catch (err) {
      Alert.alert('Could not send email', err instanceof Error ? err.message : 'Try again')
    }
  }

  async function requestVerification() {
    if (!token) return
    try {
      await apiFetch('/users/verification/request', { method: 'POST', body: JSON.stringify({ notes: 'Mobile verification request' }) }, token)
      await refreshUser()
      Alert.alert('Submitted', 'Our team will review your age and location details.')
    } catch (err) {
      Alert.alert('Could not submit', err instanceof Error ? err.message : 'Try again')
    }
  }

  const verificationLabel =
    user.verification_status === 'verified'
      ? 'Verified profile'
      : user.verification_status === 'pending'
        ? 'Verification pending'
        : 'Not verified'

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.eyebrow}>YOUR MOVIE PROFILE</Text>
      <Pressable onPress={pickPhoto}>
        <Image source={{ uri: user.photo_url || user.avatar_url }} style={styles.avatar} accessibilityLabel="Profile photo" />
        <Text style={styles.photoLink}>{user.photo_url ? 'Change photo' : 'Add photo (required for dating)'}</Text>
      </Pressable>
      <Text style={styles.heading}>{user.name}</Text>
      <Text style={styles.meta}>Profile {user.profile_completion ?? 0}% complete</Text>
      <Text style={styles.meta}>
        {genderLabel(user.gender)} · {user.country || user.city} · {user.age} · {verificationLabel}
      </Text>

      {!user.email_verified && (
        <Pressable style={styles.secondaryBtn} onPress={requestEmailVerify}>
          <Text style={styles.secondaryText}>Verify email</Text>
        </Pressable>
      )}

      {user.verification_status !== 'verified' && user.verification_status !== 'pending' && (
        <Pressable style={styles.secondaryBtn} onPress={requestVerification}>
          <Text style={styles.secondaryText}>Request age & location verification</Text>
        </Pressable>
      )}

      <FavoriteFilmPicker user={user} onSaved={refreshUser} />

      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/friends')}>
        <Text style={styles.secondaryText}>Film friends — compare taste & watch together</Text>
      </Pressable>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Your taste card</Text>
        <Text style={styles.listItem}>
          Share a link with your favourite film, rarest likes and top genres. Friends see how well you match and can add
          you with your code. No photo, age or location.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={shareTasteCard} disabled={!ownReferral}>
          <Text style={styles.primaryText}>Share my taste card</Text>
        </Pressable>
        {user.taste_card_public && (
          <Pressable onPress={hideTasteCard}>
            <Text style={styles.link}>Stop sharing my taste card</Text>
          </Pressable>
        )}
      </View>

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.muted} />
      <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor={colors.muted} />
      <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="One line about you & movies" placeholderTextColor={colors.muted} multiline />

      <PromptsEditor prompts={prompts} onChange={setPrompts} />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Dating preferences</Text>
        <Text style={styles.listItem}>I am a</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[styles.chip, gender === value && styles.chipOn]}
              onPress={() => setGender(value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: gender === value }}
            >
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.listItem}>Show me</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map(({ value, plural }) => (
            <Pressable
              key={value}
              style={[styles.chip, interestedIn.includes(value) && styles.chipOn]}
              onPress={() => setInterestedIn((list) => toggleInList(list, value))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: interestedIn.includes(value) }}
            >
              <Text style={styles.chipText}>{plural}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.listItem}>Age range for dating deck</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, minWidth: 0 }]}
            value={minAge}
            onChangeText={setMinAge}
            keyboardType="number-pad"
            placeholder="Min age"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[styles.input, { flex: 1, minWidth: 0 }]}
            value={maxAge}
            onChangeText={setMaxAge}
            keyboardType="number-pad"
            placeholder="Max age"
            placeholderTextColor={colors.muted}
          />
        </View>
        <Text style={styles.listItem}>Minimum taste match {user.plus?.active ? '' : '(ReelMates Plus)'}</Text>
        {user.plus?.active ? (
          <TextInput
            style={styles.input}
            value={minScore}
            onChangeText={setMinScore}
            keyboardType="number-pad"
            placeholder="e.g. 70 (%)"
            placeholderTextColor={colors.muted}
          />
        ) : (
          <Text style={styles.plusNote}>
            With Plus, only see people above a taste match you choose, and see everyone who already liked you.
          </Text>
        )}
      </View>

      <Pressable style={styles.primaryBtn} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </Pressable>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Refer friends</Text>
        <Text style={styles.listItem}>{ownReferral ? `Your code: ${ownReferral}` : 'Your referral code loads here.'}</Text>
        <Text style={styles.listItem}>{referralShare}</Text>
        <TextInput style={styles.input} value={friendCode} onChangeText={setFriendCode} placeholder="Enter a friend's code" placeholderTextColor={colors.muted} autoCapitalize="characters" />
        <Pressable style={styles.secondaryBtn} onPress={applyReferral}>
          <Text style={styles.secondaryText}>Apply referral code</Text>
        </Pressable>
      </View>

      <TasteStatsCard refreshKey={user.loved?.length} />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>I like</Text>
        {(user.loved || []).slice(-8).reverse().map((movie) => (
          <Text key={movie} style={styles.listItem}>{movie}</Text>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>I don't like</Text>
        {(user.hated || []).slice(-8).reverse().map((movie) => (
          <Text key={movie} style={styles.listItem}>{movie}</Text>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Pressable style={styles.dangerBtn} onPress={deleteAccount}>
        <Text style={styles.dangerText}>Delete account</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => setFeedbackOpen(true)}>
        <Text style={styles.secondaryText}>Send feedback</Text>
      </Pressable>
      <FeedbackSheet visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

      <Pressable onPress={() => Linking.openURL(Constants.expoConfig?.extra?.privacyPolicyUrl as string)}>
        <Text style={styles.link}>Privacy Policy</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(Constants.expoConfig?.extra?.termsUrl as string)}>
        <Text style={styles.link}>Terms of Service</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(`mailto:${Constants.expoConfig?.extra?.supportEmail}`)}>
        <Text style={styles.link}>Contact support</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.card, marginTop: 8 },
  photoLink: { color: colors.peach, marginTop: 8, marginBottom: 4 },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1 },
  heading: { color: colors.text, fontSize: 26, fontWeight: '700' },
  meta: { color: colors.muted, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  secondaryText: { color: colors.text, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { borderColor: colors.pink, backgroundColor: 'rgba(255,105,147,0.12)' },
  chipText: { color: colors.text, fontWeight: '600' },
  plusNote: { color: colors.peach, fontSize: 13, lineHeight: 18 },
  block: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  blockTitle: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  listItem: { color: colors.soft, marginBottom: 4 },
  logoutBtn: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  logoutText: { color: colors.text, fontWeight: '600' },
  dangerBtn: { borderWidth: 1, borderColor: colors.error, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: colors.error, fontWeight: '700' },
  link: { color: colors.muted, textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' }
})
