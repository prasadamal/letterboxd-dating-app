import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Chip, ProgressBar } from '../components/ui'
import { apiFetch } from '../lib/api'
import { signup, useAuth } from '../lib/auth'
import { haptic } from '../lib/haptics'
import { GENDER_OPTIONS, defaultInterestedIn, toggleInList } from '../lib/profileOptions'
import { colors, fonts, radii, type } from '../lib/theme'
import type { Gender } from '../lib/types'

type Step = 'name' | 'age' | 'country' | 'here' | 'identity' | 'account' | 'photo'
const QUICK_COUNTRIES = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// One question per screen. The account is created at "account"; "photo" comes after, signed in.
export default function SignupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { setSession, refreshUser } = useAuth()
  const [index, setIndex] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    age: '',
    country: '',
    dating: null as boolean | null,
    gender: null as Gender | null,
    interestedIn: [] as Gender[],
    email: '',
    password: '',
    friendCode: '',
    terms: false
  })

  const steps = useMemo<Step[]>(
    () => ['name', 'age', 'country', 'here', ...(form.dating ? (['identity'] as Step[]) : []), 'account', 'photo'],
    [form.dating]
  )
  const step = steps[index]
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }))

  function validate(): string {
    const age = Number(form.age)
    switch (step) {
      case 'name':
        return form.name.trim().length >= 2 ? '' : 'Tell us what to call you.'
      case 'age':
        return Number.isInteger(age) && age >= 18 && age <= 100 ? '' : 'ReelMates is for people 18 and over.'
      case 'country':
        return form.country.trim().length >= 2 ? '' : 'Where are you based?'
      case 'here':
        return form.dating === null ? 'Pick one. You can change it later.' : ''
      case 'identity':
        if (!form.gender) return 'Choose how you identify.'
        return form.interestedIn.length ? '' : 'Choose who you would like to meet.'
      case 'account':
        if (!EMAIL_RE.test(form.email.trim())) return 'Enter a valid email.'
        if (form.password.length < 8) return 'Use at least 8 characters for your password.'
        return form.terms ? '' : 'Please accept the Terms and Privacy Policy.'
      default:
        return ''
    }
  }

  async function createAccount() {
    setBusy(true)
    try {
      const data = await signup({
        name: form.name.trim(),
        age: Number(form.age),
        country: form.country.trim(),
        datingEnabled: Boolean(form.dating),
        ...(form.dating ? { gender: form.gender, interestedIn: form.interestedIn } : {}),
        email: form.email.trim(),
        password: form.password,
        termsAccepted: true,
        ...(form.friendCode.trim() ? { referralCode: form.friendCode.trim().toUpperCase() } : {})
      })
      await setSession(data.token, data.user, data.platform, data.refreshToken)
      setCreated(true)
      haptic.success()
      setIndex((i) => i + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account')
    } finally {
      setBusy(false)
    }
  }

  async function next() {
    const problem = validate()
    setError(problem)
    if (problem) {
      haptic.warning()
      return
    }
    if (step === 'account') return createAccount()
    if (step === 'photo') return router.replace('/(tabs)/home')
    setIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  function back() {
    setError('')
    if (index === 0) return router.back()
    setIndex((i) => i - 1)
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true })
    const asset = result.assets?.[0]
    if (result.canceled || !asset?.base64) return
    setBusy(true)
    setError('')
    try {
      await apiFetch('/users/avatar', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: asset.base64, contentType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg' })
      })
      setPhotoUri(asset.uri)
      await refreshUser().catch(() => null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try another photo.')
    } finally {
      setBusy(false)
    }
  }

  const progress = ((index + 1) / steps.length) * 100

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        {!created ? (
          <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={{ flex: 1 }}>
          <ProgressBar value={progress} height={6} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'name' && (
          <>
            <Text style={type.h1}>What should we call you?</Text>
            <TextInput style={styles.bigInput} value={form.name} onChangeText={(name) => set({ name })} placeholder="Your first name" placeholderTextColor={colors.faint} autoFocus autoCapitalize="words" returnKeyType="next" onSubmitEditing={next} maxLength={80} />
            <Text style={type.small}>This is how you'll appear to friends and matches.</Text>
          </>
        )}

        {step === 'age' && (
          <>
            <Text style={type.h1}>How old are you, {form.name.trim().split(' ')[0]}?</Text>
            <TextInput style={styles.bigInput} value={form.age} onChangeText={(age) => set({ age: age.replace(/[^0-9]/g, '') })} placeholder="Age" placeholderTextColor={colors.faint} keyboardType="number-pad" autoFocus maxLength={3} returnKeyType="next" onSubmitEditing={next} />
            <Text style={type.small}>ReelMates is 18+. We show your age on your profile.</Text>
          </>
        )}

        {step === 'country' && (
          <>
            <Text style={type.h1}>Where are you based?</Text>
            <TextInput style={styles.bigInput} value={form.country} onChangeText={(country) => set({ country })} placeholder="Country" placeholderTextColor={colors.faint} autoFocus autoCapitalize="words" returnKeyType="next" onSubmitEditing={next} maxLength={80} />
            <View style={styles.chips}>
              {QUICK_COUNTRIES.map((country) => (
                <Chip key={country} label={country} selected={form.country.trim().toLowerCase() === country.toLowerCase()} onPress={() => set({ country })} accessibilityRole="radio" />
              ))}
            </View>
            <Text style={type.small}>Dating opens country by country, so this decides when yours goes live.</Text>
          </>
        )}

        {step === 'here' && (
          <>
            <Text style={type.h1}>What brings you here?</Text>
            <Option
              emoji="🍿"
              title="Films & friends"
              body="Daily films, your film personality, and taste matches with friends."
              selected={form.dating === false}
              onPress={() => set({ dating: false })}
            />
            <Option
              emoji="💘"
              title="Dating too"
              body="Everything above, plus a dating deck ranked by how well your taste matches."
              selected={form.dating === true}
              onPress={() => set({ dating: true })}
            />
            <Text style={type.small}>You can switch anytime in Settings.</Text>
          </>
        )}

        {step === 'identity' && (
          <>
            <Text style={type.h1}>A little about you</Text>
            <Text style={type.label}>I am a</Text>
            <View style={styles.chips}>
              {GENDER_OPTIONS.map(({ value, label }) => (
                <Chip key={value} label={label} selected={form.gender === value} onPress={() => set({ gender: value, interestedIn: form.interestedIn.length ? form.interestedIn : defaultInterestedIn(value) })} accessibilityRole="radio" />
              ))}
            </View>
            <Text style={[type.label, { marginTop: 12 }]}>Show me</Text>
            <View style={styles.chips}>
              {GENDER_OPTIONS.map(({ value, plural }) => (
                <Chip key={value} label={plural} selected={form.interestedIn.includes(value)} onPress={() => set({ interestedIn: toggleInList(form.interestedIn, value) })} accessibilityRole="checkbox" />
              ))}
            </View>
            <Text style={type.small}>You only see people who'd want to see you too.</Text>
          </>
        )}

        {step === 'account' && (
          <>
            <Text style={type.h1}>Save your taste</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={(email) => set({ email })} placeholder="Email" placeholderTextColor={colors.faint} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
            <View style={styles.passwordRow}>
              <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} value={form.password} onChangeText={(password) => set({ password })} placeholder="Password (8+ characters)" placeholderTextColor={colors.faint} secureTextEntry={!showPassword} autoComplete="new-password" textContentType="newPassword" />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} style={{ paddingHorizontal: 14 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
              </Pressable>
            </View>
            <TextInput style={styles.input} value={form.friendCode} onChangeText={(friendCode) => set({ friendCode })} placeholder="Friend's code (optional)" placeholderTextColor={colors.faint} autoCapitalize="characters" autoCorrect={false} />
            <Pressable style={styles.termsRow} onPress={() => set({ terms: !form.terms })} accessibilityRole="checkbox" accessibilityState={{ checked: form.terms }}>
              <View style={[styles.checkbox, form.terms && styles.checkboxOn]}>{form.terms && <Ionicons name="checkmark" size={14} color={colors.onLime} />}</View>
              <Text style={styles.termsText}>
                I'm 18+ and accept the{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(String(Constants.expoConfig?.extra?.termsUrl))}>Terms</Text> (zero tolerance for abuse) and the{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(String(Constants.expoConfig?.extra?.privacyPolicyUrl))}>Privacy Policy</Text>.
              </Text>
            </Pressable>
          </>
        )}

        {step === 'photo' && (
          <>
            <Text style={type.h1}>Add a photo</Text>
            <Text style={type.body}>
              {form.dating
                ? 'Matches start with a face. You need a photo to appear in the dating deck.'
                : 'Optional. It helps friends find you.'}
            </Text>
            <Pressable onPress={pickPhoto} style={styles.photoPick} accessibilityRole="button" accessibilityLabel="Choose a photo">
              {photoUri ? <Avatar uri={photoUri} name={form.name} size={168} ring /> : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="camera-outline" size={36} color={colors.lime} />
                  <Text style={[type.small, { color: colors.soft }]}>Tap to choose</Text>
                </View>
              )}
            </Pressable>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 'photo' ? (
          <>
            <Button title={photoUri ? "Let's go" : 'Upload a photo'} icon={photoUri ? 'arrow-forward' : 'image-outline'} loading={busy} onPress={photoUri ? next : pickPhoto} />
            {!photoUri && <Button title="Skip for now" variant="ghost" onPress={() => router.replace('/(tabs)/home')} />}
          </>
        ) : (
          <Button title={step === 'account' ? 'Create account' : 'Continue'} icon={step === 'account' ? 'sparkles' : 'arrow-forward'} loading={busy} onPress={next} />
        )}
        {index === 0 && <Button title="I already have an account" variant="ghost" onPress={() => router.replace('/login')} />}
      </View>
    </KeyboardAvoidingView>
  )
}

function Option({ emoji, title, body, selected, onPress }: { emoji: string; title: string; body: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptic.select()
        onPress()
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.option, selected && styles.optionOn]}
    >
      <Text style={styles.optionEmoji}>{emoji}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={type.h3}>{title}</Text>
        <Text style={type.small}>{body}</Text>
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.lime : colors.faint} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 32 },
  body: { padding: 24, gap: 16, flexGrow: 1 },
  bigInput: { fontFamily: fonts.display, fontSize: 30, color: colors.text, borderBottomWidth: 2, borderBottomColor: colors.lime, paddingVertical: 10 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, color: colors.text, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, padding: 18 },
  optionOn: { borderColor: colors.lime, backgroundColor: 'rgba(212, 255, 63, 0.07)' },
  optionEmoji: { fontSize: 34 },
  termsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  termsText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
  link: { color: colors.text, textDecorationLine: 'underline' },
  photoPick: { alignSelf: 'center', marginTop: 12 },
  photoEmpty: { width: 168, height: 168, borderRadius: 84, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.card },
  error: { color: colors.red, fontSize: 14 },
  footer: { paddingHorizontal: 24, gap: 4 }
})
