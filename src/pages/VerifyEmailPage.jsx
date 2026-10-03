import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { BrandMark } from '../components/BrandMark.jsx'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [message, setMessage] = useState(token ? 'Confirming your email…' : 'This link is missing a token.')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    apiFetch('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
      .then(() => setMessage('Email verified. You can go back to ReelMates.'))
      .catch((err) => {
        setMessage('')
        setError(err.message)
      })
  }, [token])

  return (
    <div className="auth-shell">
      <div className="auth-card card-panel">
        <BrandMark />
        <h2>Email verification</h2>
        {message && <p className="hero-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <Link to="/">Back to ReelMates</Link>
      </div>
    </div>
  )
}
