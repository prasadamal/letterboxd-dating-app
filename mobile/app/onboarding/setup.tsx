import { useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { colors, typography, radii } from '../../lib/theme'

export default function OnboardingSetup() {
  const { token, refreshUser } = useAuth()
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add a profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: true })
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri)
      if (result.assets[0].base64 && token) {
        await apiFetch(
          '/users/avatar',
          {
            method: 'POST',
            body: JSON.stringify({ imageBase64: result.assets[0].base64, contentType: 'image/jpeg' })
          },
          token
        )
      }
    }
  }

  async function save() {
    if (!token) return
    setSaving(true)
    try {
      await apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify({ bio, country }) }, token)
      await refreshUser()
      router.replace('/(tabs)/home')
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={styles.kicker}>TRUST & PROFILE</Text>
      <Text style={styles.title}>Finish your cinematic profile</Text>
      <Text style={styles.hint}>Matchmaking unlocks at 80% completion (photo, bio, country).</Text>

      <Pressable style={styles.photoBtn} onPress={pickPhoto}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <Text style={styles.photoText}>Add profile photo</Text>}
      </Pressable>

      <TextInput style={styles.input} placeholder="Country" placeholderTextColor={colors.muted} value={country} onChangeText={setCountry} />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="One line about you & movies"
        placeholderTextColor={colors.muted}
        multiline
        value={bio}
        onChangeText={setBio}
      />

      <Pressable style={styles.cta} onPress={save} disabled={saving}>
        <Text style={styles.ctaText}>{saving ? 'Saving…' : 'Continue to ReelMates'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  kicker: { color: colors.accent, ...typography.caption },
  title: { color: colors.text, ...typography.title },
  hint: { color: colors.muted, lineHeight: 20 },
  photoBtn: {
    height: 180,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  photo: { width: '100%', height: '100%' },
  photoText: { color: colors.soft },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  cta: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#111', fontWeight: '800' }
})
