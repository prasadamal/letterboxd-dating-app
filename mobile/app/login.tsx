import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useRouter } from 'expo-router'
import { login, signup, useAuth } from '../lib/auth'
import { colors } from '../lib/theme'

export default function LoginScreen() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    age: '25',
    country: '',
    bio: '',
    gender: 'female' as 'male' | 'female',
    referralCode: ''
  })

  async function submit() {
    setError('')
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
      await setSession(data.token, data.user, data.platform)
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
          <Text style={styles.sub}>Register with your movie line. Play 10 films daily. Dating unlocks at 500 men + 500 women.</Text>

          <View style={styles.toggleRow}>
            {(['signup', 'login'] as const).map((item) => (
              <Pressable key={item} style={[styles.toggle, mode === item && styles.toggleActive]} onPress={() => setMode(item)}>
                <Text style={styles.toggleText}>{item === 'login' ? 'Login' : 'Register'}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'signup' && (
            <>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.muted} value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <TextInput style={styles.input} placeholder="Age (18+)" placeholderTextColor={colors.muted} keyboardType="number-pad" value={form.age} onChangeText={(age) => setForm({ ...form, age })} />
              <TextInput style={styles.input} placeholder="Country" placeholderTextColor={colors.muted} value={form.country} onChangeText={(country) => setForm({ ...form, country })} />
              <TextInput style={[styles.input, styles.multiline]} placeholder="One line about you & the world of movies" placeholderTextColor={colors.muted} multiline value={form.bio} onChangeText={(bio) => setForm({ ...form, bio })} />
              <View style={styles.genderRow}>
                {(['female', 'male'] as const).map((gender) => (
                  <Pressable key={gender} style={[styles.genderBtn, form.gender === gender && styles.genderActive]} onPress={() => setForm({ ...form, gender })}>
                    <Text style={styles.genderText}>{gender === 'female' ? 'Woman' : 'Man'}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Friend referral code (optional)" placeholderTextColor={colors.muted} autoCapitalize="characters" value={form.referralCode} onChangeText={(referralCode) => setForm({ ...form, referralCode })} />
              <Pressable style={styles.termsRow} onPress={() => setTermsAccepted((value) => !value)}>
                <View style={[styles.checkbox, termsAccepted && styles.checkboxOn]} />
                <Text style={styles.termsText}>I am 18+, and I accept the Privacy Policy & Terms.</Text>
              </Pressable>
            </>
          )}

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}</Text>
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
  genderBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  genderActive: { borderColor: colors.pink, backgroundColor: 'rgba(255,105,147,0.12)' },
  genderText: { color: colors.text, fontWeight: '600' },
  termsRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  checkboxOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  termsText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 16 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.error, marginBottom: 8 },
  primaryBtn: { marginTop: 6, borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.pink },
  primaryBtnText: { color: '#fff', fontWeight: '700' }
})
