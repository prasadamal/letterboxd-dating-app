import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '../components/ui'
import { apiFetch } from '../lib/api'
import { login, useAuth } from '../lib/auth'
import { haptic } from '../lib/haptics'
import { colors, radii, type } from '../lib/theme'

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { setSession } = useAuth()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'forgot') {
        const data = await apiFetch<{ message: string; devResetUrl?: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() })
        })
        setNotice(data.devResetUrl ? `${data.message}\n${data.devResetUrl}` : data.message)
        return
      }
      const data = await login(email.trim(), password)
      await setSession(data.token, data.user, data.platform, data.refreshToken)
      haptic.success()
      router.replace('/(tabs)/home')
    } catch (err) {
      haptic.warning()
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[type.h1, { marginTop: 12 }]}>{mode === 'login' ? 'Welcome back 🍿' : 'Reset your password'}</Text>
        <Text style={type.body}>
          {mode === 'login' ? "Today's films are waiting." : "We'll email you a link to set a new one."}
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        {mode === 'login' && (
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.faint}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} style={styles.eye}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
            </Pressable>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!notice && <Text style={styles.notice}>{notice}</Text>}

        <Button title={mode === 'login' ? 'Log in' : 'Send reset link'} loading={busy} onPress={submit} style={{ marginTop: 8 }} />
        <Button
          title={mode === 'login' ? 'Forgot password?' : 'Back to log in'}
          variant="ghost"
          onPress={() => {
            setMode(mode === 'login' ? 'forgot' : 'login')
            setError('')
            setNotice('')
          }}
        />
        <View style={styles.footer}>
          <Text style={type.small}>New here?</Text>
          <Pressable onPress={() => router.replace('/signup')} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.footerLink}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 24, gap: 14, flexGrow: 1 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, color: colors.text, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  passwordInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  eye: { paddingHorizontal: 14 },
  error: { color: colors.red },
  notice: { color: colors.green },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 'auto', paddingTop: 24 },
  footerLink: { color: colors.lime, fontSize: 13, fontWeight: '700' }
})
