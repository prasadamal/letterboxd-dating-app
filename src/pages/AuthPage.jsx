import { useState } from 'react'
import { apiFetch, setToken } from '../lib/api.js'
import { BrandMark } from '../components/BrandMark.jsx'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: 'maya@example.com',
    password: '123456',
    name: 'Maya',
    age: 27,
    city: 'Brooklyn',
    bio: 'I like thoughtful cinema, slow-burn romance, and good conversations.'
  })
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')

    try {
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form
      const data = await apiFetch(`/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      setToken(data.token)
      onAuth(data.user)
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
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" type="number" />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A few words about your movie vibe" rows="3" />
            </>
          )}

          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" />

          {error && <p className="error-text">{error}</p>}
          <button className="primary-button auth-submit" type="submit">
            {mode === 'login' ? 'Login to your profile' : 'Create my taste profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
