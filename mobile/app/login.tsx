import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { login, signup, useAuth } from '../lib/auth'
import { apiFetch } from '../lib/api'
import { colors } from '../lib/theme'
import { GENDER_OPTIONS, defaultInterestedIn, toggleInList } from '../lib/profileOptions'
import type { Gender } from '../lib/types'

export default function LoginScreen() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('signup')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    country: '',
    bio: '',
    gender: 'female' as Gender,
    interestedIn: ['male'] as Gender[],
    referralCode: ''
  })

  async function forgot() {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const data = await apiFetch<{ message: string; devResetUrl?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: form.email })
      })
      setNotice(data.devResetUrl ? `${data.message}\n${data.devResetUrl}` : data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link')
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    if (mode === 'forgot') return forgot()
    if (mode === 'signup') {
      const age = Number(form.age)
      if (!Number.isInteger(age) || age < 18) return setError('You must be 18 or older to use ReelMates.')
      if (!termsAccepted) return setError('Please accept the Terms and Privacy Policy.')
      if (form.password.length < 8) return setError('Password must be at least 8 characters.')
      if (!form.interestedIn.length) return setError('Choose who you would like to meet.')
    }
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const data =
        mode === 'login'
          ? await login(form.email, form.password)
          : await signup({
              ...form,
              age: Number(form.age),
              termsAccepted
            })
      await setSession(data.token, data.user, data.platform, data.refreshToken)
      router.replace('/(tabs)/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>REELMATES</Text>
          <Text style={styles.title}>Movie taste → real matches</Text>
          <Text style={styles.sub}>Register with your movie line. Play 10 films daily. Dating opens country by country as people join.</Text>

          <View style={styles.toggleRow}>
            {(['signup', 'login', 'forgot'] as const).map((item) => (
              <Pressable key={item} style={[styles.toggle, mode === item && styles.toggleActive]} onPress={() => setMode(item)}>
                <Text style={styles.toggleText}>{item === 'login' ? 'Login' : item === 'forgot' ? 'Reset' : 'Register'}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'signup' && (
            <>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.muted} value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <TextInput style={styles.input} placeholder="Age (18+)" placeholderTextColor={colors.muted} keyboardType="number-pad" value={form.age} onChangeText={(age) => setForm({ ...form, age })} />
              <TextInput style={styles.input} placeholder="Country" placeholderTextColor={colors.muted} value={form.country} onChangeText={(country) => setForm({ ...form, country })} />
              <TextInput style={[styles.input, styles.multiline]} placeholder="One line about you & the world of movies" placeholderTextColor={colors.muted} multiline value={form.bio} onChangeText={(bio) => setForm({ ...form, bio })} />
              <Text style={styles.fieldLabel}>I am a</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <Pressable
                    key={value}
                    style={[styles.genderBtn, form.gender === value && styles.genderActive]}
                    onPress={() => setForm({ ...form, gender: value, interestedIn: defaultInterestedIn(value) })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: form.gender === value }}
                  >
                    <Text style={styles.genderText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Show me</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(({ value, plural }) => (
                  <Pressable
                    key={value}
                    style={[styles.genderBtn, form.interestedIn.includes(value) && styles.genderActive]}
                    onPress={() => setForm({ ...form, interestedIn: toggleInList(form.interestedIn, value) })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: form.interestedIn.includes(value) }}
                  >
                    <Text style={styles.genderText} numberOfLines={1} adjustsFontSizeToFit>
                      {plural === 'Non-binary people' ? 'Non-binary' : plural}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Friend referral code (optional)" placeholderTextColor={colors.muted} autoCapitalize="characters" value={form.referralCode} onChangeText={(referralCode) => setForm({ ...form, referralCode })} />
              <View style={styles.termsRow}>
                <Pressable
                  onPress={() => setTermsAccepted((value) => !value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted }}
                  hitSlop={8}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxOn]} />
                </Pressable>
                <Text style={styles.termsText}>
                  I am 18+ and accept the{' '}
                  <Text style={styles.termsLink} onPress={() => Linking.openURL(String(Constants.expoConfig?.extra?.termsUrl))}>
                    Terms
                  </Text>
                  {' '}(no tolerance for abusive content or users) and the{' '}
                  <Text style={styles.termsLink} onPress={() => Linking.openURL(String(Constants.expoConfig?.extra?.privacyPolicyUrl))}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </>
          )}

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
          {mode !== 'forgot' && (
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!notice && <Text style={styles.sub}>{notice}</Text>}

          <Pressable style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            <Text style={styles.primaryBtnText}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Login' : mode === 'forgot' ? 'Send reset link' : 'Create account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  sub: { color: colors.muted, lineHeight: 20, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggle: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  toggleText: { color: colors.text, fontWeight: '600' },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  fieldLabel: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  genderBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  genderActive: { borderColor: colors.pink, backgroundColor: 'rgba(255,105,147,0.12)' },
  genderText: { color: colors.text, fontWeight: '600' },
  termsRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  checkboxOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  termsText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 16 },
  termsLink: { color: colors.text, textDecorationLine: 'underline' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.error, marginBottom: 8 },
  primaryBtn: { marginTop: 6, borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.pink },
  primaryBtnText: { color: '#fff', fontWeight: '700' }
})
