import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Linking } from 'react-native'
import Constants from 'expo-constants'
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
  const [referralCode, setReferralCode] = useState('')
  const [referralShare, setReferralShare] = useState('')
  const [saving, setSaving] = useState(false)
  const [minAge, setMinAge] = useState('18')
  const [maxAge, setMaxAge] = useState('45')

  useEffect(() => {
    if (!token) return
    apiFetch<{ code: string; shareMessage: string }>('/dating/referral', {}, token)
      .then((data) => {
        setReferralCode(data.code)
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
              maxAge: Number(maxAge) || 45,
              countries: country ? [country] : []
            }
          })
        },
        token
      )
      await refreshUser()
    } finally {
      setSaving(false)
    }
  }

  async function applyReferral() {
    if (!token || !referralCode.trim()) return
    await apiFetch('/dating/referral/apply', { method: 'POST', body: JSON.stringify({ code: referralCode }) }, token)
    Alert.alert('Referral applied', 'Thanks for joining through a friend.')
  }

  async function deleteAccount() {
    Alert.alert('Delete account', 'This permanently removes your profile and taste history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiFetch('/safety/account', { method: 'DELETE' }, token)
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.eyebrow}>YOUR MOVIE PROFILE</Text>
      <Text style={styles.heading}>{user.name}</Text>
      <Text style={styles.meta}>{user.gender} · {user.country || user.city} · {user.age}</Text>

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
        <Text style={styles.listItem}>{referralShare || 'Your referral code loads here.'}</Text>
        <TextInput style={styles.input} value={referralCode} onChangeText={setReferralCode} placeholder="Enter a friend's code" placeholderTextColor={colors.muted} />
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
        <Text style={styles.link}>Privacy Policy & Terms</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
