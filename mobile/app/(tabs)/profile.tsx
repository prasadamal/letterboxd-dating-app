import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Linking } from 'react-native'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors } from '../../lib/theme'

export default function ProfileScreen() {
  const { user, token, refreshUser, signOut } = useAuth()
  const router = useRouter()
  const [name, setName] = useState(user?.name || '')
  const [city, setCity] = useState(user?.city || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [hobbies, setHobbies] = useState((user?.hobbies || []).join(', '))
  const [saving, setSaving] = useState(false)

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
            city,
            bio,
            hobbies: hobbies.split(',').map((item) => item.trim()).filter(Boolean)
          })
        },
        token
      )
      await refreshUser()
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    await signOut()
    router.replace('/login')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.eyebrow}>YOUR MOVIE PROFILE</Text>
      <Text style={styles.heading}>{user.name}</Text>

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.muted} />
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={colors.muted} />
      <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor={colors.muted} multiline />
      <TextInput style={styles.input} value={hobbies} onChangeText={setHobbies} placeholder="Hobbies (comma-separated)" placeholderTextColor={colors.muted} />

      <Pressable style={styles.primaryBtn} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </Pressable>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Liked</Text>
        {(user.loved || []).map((movie) => (
          <Text key={movie} style={styles.listItem}>{movie}</Text>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Disliked</Text>
        {(user.hated || []).map((movie) => (
          <Text key={movie} style={styles.listItem}>{movie}</Text>
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Pressable onPress={() => Linking.openURL(Constants.expoConfig?.extra?.privacyPolicyUrl as string)}>
        <Text style={styles.link}>Privacy Policy</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  eyebrow: { color: colors.peach, fontSize: 11, letterSpacing: 1.1 },
  heading: { color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  primaryBtn: { backgroundColor: colors.pink, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  block: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  blockTitle: { color: colors.text, fontWeight: '700', marginBottom: 8 },
  listItem: { color: colors.soft, marginBottom: 4 },
  logoutBtn: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  logoutText: { color: colors.text, fontWeight: '600' },
  link: { color: colors.muted, textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' }
})
