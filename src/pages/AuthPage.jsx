import { useState } from 'react'
import { apiFetch, setSession } from '../lib/api.js'
import { BrandMark } from '../components/BrandMark.jsx'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [notice, setNotice] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')
  const [form, setForm] = useState({
    email: 'maya@example.com',
    password: '123456',
    name: 'Maya',
    age: 27,
    city: 'Brooklyn',
    country: 'United States',
    gender: 'female',
    bio: 'I like thoughtful cinema, slow-burn romance, and good conversations.',
    termsAccepted: false
  })
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')

    try {
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              name: form.name,
              age: Number(form.age),
              country: form.country,
              city: form.city,
              gender: form.gender,
              bio: form.bio,
              termsAccepted: form.termsAccepted === true
            }
      const data = await apiFetch(`/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      setSession(data.token, data.refreshToken)
      onAuth(data.user)
    } catch (err) {
      setError(err.message)
    }
  }

  async function forgot(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setDevResetUrl('')
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: form.email })
      })
      setNotice(data.message)
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card-panel">
        <BrandMark />

        <div className="auth-toggle">
          <button className={mode === 'login' ? 'nav-pill active' : 'nav-pill'} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'signup' ? 'nav-pill active' : 'nav-pill'} onClick={() => setMode('signup')}>
            Sign up
          </button>
          <button className={mode === 'forgot' ? 'nav-pill active' : 'nav-pill'} onClick={() => setMode('forgot')}>
            Reset
          </button>
        </div>

        {mode === 'forgot' ? (
          <form className="auth-form" onSubmit={forgot}>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" required />
            {error && <p className="error-text">{error}</p>}
            {notice && <p className="hero-text">{notice}</p>}
            {devResetUrl && (
              <p className="hero-text">
                Dev reset link: <a href={devResetUrl}>{devResetUrl}</a>
              </p>
            )}
            <button className="primary-button auth-submit" type="submit">
              Send reset link
            </button>
          </form>
        ) : (
        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" type="number" />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" required />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A few words about your movie vibe" rows="3" />
              <label className="terms-row">
                <input
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                  required
                />
                I accept the Terms and Privacy Policy
              </label>
            </>
          )}

          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'} type="password" minLength={mode === 'signup' ? 8 : 1} />

          {error && <p className="error-text">{error}</p>}
          <button className="primary-button auth-submit" type="submit">
            {mode === 'login' ? 'Login to your profile' : 'Create my taste profile'}
          </button>
          {mode === 'login' && (
            <button type="button" className="ghost-button" onClick={() => setMode('forgot')}>
              Forgot password
            </button>
          )}
        </form>
        )}
      </div>
    </div>
  )
}
