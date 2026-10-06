import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FavoriteFilmPicker } from '../components/FavoriteFilmPicker'
import { PromptsEditor } from '../components/PromptsEditor'
import { Avatar, Button, SectionTitle } from '../components/ui'
import { apiFetch } from '../lib/api'
import { useAuth } from '../lib/auth'
import { haptic } from '../lib/haptics'
import { colors, radii, type } from '../lib/theme'
import type { ProfilePrompt } from '../lib/types'

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [country, setCountry] = useState(user?.country || user?.city || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [prompts, setPrompts] = useState<ProfilePrompt[]>((user?.prompts || []).map(({ key, answer }) => ({ key, answer })))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  if (!user) return null

  async function pickPhoto() {
    // The system photo picker needs no library permission; a square crop keeps uploads well under the 2.5MB cap.
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true })
    const asset = result.assets?.[0]
    if (result.canceled || !asset?.base64) return
    setUploading(true)
    try {
      await apiFetch('/users/avatar', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: asset.base64, contentType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg' })
      })
      await refreshUser()
      haptic.success()
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try a smaller photo')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setSaving(true)
    try {
      await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), country: country.trim(), bio: bio.trim(), prompts: prompts.filter((p) => p.answer.trim()) })
      })
      await refreshUser()
      haptic.success()
      router.back()
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickPhoto} style={styles.photo} accessibilityRole="button" accessibilityLabel="Change photo">
          <Avatar uri={user.photo_url} name={user.name} size={124} ring />
          <View style={styles.photoBadge}>
            <Ionicons name={uploading ? 'hourglass' : 'camera'} size={16} color={colors.onLime} />
          </View>
        </Pressable>
        <Text style={[type.small, { textAlign: 'center' }]}>
          {user.photo_url ? 'Tap to change your photo' : user.dating_enabled !== false ? 'Add a photo to appear in the dating deck' : 'Add a photo so friends can find you'}
        </Text>

        <SectionTitle title="About you" />
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.faint} maxLength={80} />
        <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor={colors.faint} maxLength={80} />
        <TextInput style={[styles.input, styles.multiline]} value={bio} onChangeText={setBio} placeholder="One line about you and films" placeholderTextColor={colors.faint} multiline maxLength={280} />

        <SectionTitle title="All-time favourite film" />
        <FavoriteFilmPicker user={user} onSaved={refreshUser} />

        <SectionTitle title="Film prompts" />
        <PromptsEditor prompts={prompts} onChange={setPrompts} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title="Save" icon="checkmark" loading={saving} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  photo: { alignSelf: 'center' },
  photoBadge: { position: 'absolute', right: 4, bottom: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, color: colors.text, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }
})
