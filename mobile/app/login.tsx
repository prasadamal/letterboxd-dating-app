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
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: 'maya@example.com',
    password: '123456',
    name: 'Maya',
    age: '27',
    city: 'Brooklyn',
    bio: 'Thoughtful cinema and good conversation.'
  })

  async function submit() {
    setError('')
    setLoading(true)
    try {
      const data =
        mode === 'login'
          ? await login(form.email, form.password)
          : await signup({ ...form, age: Number(form.age) })
      await setSession(data.token, data.user)
      router.replace('/(tabs)/discover')
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
          <View style={styles.brandRow}>
            <View style={styles.mark}>
              <Text style={styles.markText}>RM</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>MOVIE DATING</Text>
              <Text style={styles.title}>ReelMates</Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            {(['login', 'signup'] as const).map((item) => (
              <Pressable key={item} style={[styles.toggle, mode === item && styles.toggleActive]} onPress={() => setMode(item)}>
                <Text style={styles.toggleText}>{item === 'login' ? 'Login' : 'Sign up'}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'signup' && (
            <>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={colors.muted} value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
              <TextInput style={styles.input} placeholder="Age" placeholderTextColor={colors.muted} keyboardType="number-pad" value={form.age} onChangeText={(age) => setForm({ ...form, age })} />
              <TextInput style={styles.input} placeholder="City" placeholderTextColor={colors.muted} value={form.city} onChangeText={(city) => setForm({ ...form, city })} />
              <TextInput style={[styles.input, styles.multiline]} placeholder="Bio" placeholderTextColor={colors.muted} multiline value={form.bio} onChangeText={(bio) => setForm({ ...form, bio })} />
            </>
          )}

          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(email) => setForm({ ...form, email })} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={form.password} onChangeText={(password) => setForm({ ...form, password })} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create profile'}</Text>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  mark: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple },
  markText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggle: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  toggleActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  toggleText: { color: colors.text, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', color: colors.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  error: { color: colors.error, marginBottom: 8 },
  primaryBtn: { marginTop: 6, borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.pink },
  primaryBtnText: { color: '#fff', fontWeight: '700' }
})
