import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Linking } from 'react-native'
import Constants from 'expo-constants'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'

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
  const [minAge, setMinAge] = useState(String(user?.discovery_prefs?.minAge || 18))
  const [maxAge, setMaxAge] = useState(String(user?.discovery_prefs?.maxAge || 99))

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
            discoveryPrefs: {
              minAge: Number(minAge) || 18,
              maxAge: Number(maxAge) || 99,
              countries: user?.discovery_prefs?.countries || []
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
        {user.gender} · {user.country || user.city} · {user.age} · {verificationLabel}
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

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.muted} />
      <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor={colors.muted} />
      <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="One line about you & movies" placeholderTextColor={colors.muted} multiline />

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Discovery preferences</Text>
        <Text style={styles.listItem}>Age range for dating deck</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={minAge}
            onChangeText={setMinAge}
            keyboardType="number-pad"
            placeholder="Min age"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={maxAge}
            onChangeText={setMaxAge}
            keyboardType="number-pad"
            placeholder="Max age"
            placeholderTextColor={colors.muted}
          />
        </View>
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

      <View style={styles.block}>
        <Text style={styles.blockTitle}>I like</Text>
        {(user.loved || []).map((movie) => (
          <Text key={movie} style={styles.listItem}>{movie}</Text>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>I don't like</Text>
        {(user.hated || []).map((movie) => (
          <Text key={movie} style={styles.listItem}>{movie}</Text>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Pressable style={styles.dangerBtn} onPress={deleteAccount}>
        <Text style={styles.dangerText}>Delete account</Text>
      </Pressable>

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
  block: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  blockTitle: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  listItem: { color: colors.soft, marginBottom: 4 },
  logoutBtn: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  logoutText: { color: colors.text, fontWeight: '600' },
  dangerBtn: { borderWidth: 1, borderColor: colors.error, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: colors.error, fontWeight: '700' },
  link: { color: colors.muted, textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' }
})
