import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { BrandMark } from '../components/BrandMark.jsx'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })
      setMessage('Password updated. You can log in now.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card-panel">
        <BrandMark />
        <h2>Choose a new password</h2>
        {!token && <p className="error-text">This reset link is missing a token.</p>}
        <form className="auth-form" onSubmit={submit}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            type="password"
            minLength={8}
            required
          />
          {error && <p className="error-text">{error}</p>}
          {message && <p className="hero-text">{message}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={!token}>
            Update password
          </button>
        </form>
        <Link to="/">Back to login</Link>
      </div>
    </div>
  )
}
