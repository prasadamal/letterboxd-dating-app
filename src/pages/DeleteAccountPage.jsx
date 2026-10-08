import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'
import { apiFetch, clearToken, getToken } from '../lib/api.js'
import { SUPPORT_EMAIL } from '../lib/site.js'

// Google Play asks for a web page where people can delete their account; the app has the same button.
export default function DeleteAccountPage({ user, onDeleted }) {
  const [form, setForm] = useState({ email: '', password: '', confirm: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.title = 'Delete your account · ReelMates'
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.confirm) return setError('Tick the box to confirm.')
    setBusy(true)
    try {
      // Signed in on this site: use that session. Otherwise sign in just for this request (nothing is stored).
      const token = user
        ? getToken()
        : (await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) }, null)).token
      await apiFetch('/safety/account', { method: 'DELETE' }, token)
      if (user) clearToken()
      setDone(true)
      onDeleted?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="site-page">
      <main className="site-column">
        <Link to="/" className="site-home">
          <BrandMark />
        </Link>
        <section className="panel">
          <h1 className="panel-title">Delete your account</h1>
          {done ? (
            <p className="muted-text">Your account and data have been deleted. Thanks for watching with us.</p>
          ) : (
            <>
              <p className="muted-text">
                This permanently deletes your profile, photos, ratings, friends, matches and messages. It can’t be undone. You can also do
                this in the app: You → Settings → Delete account.
              </p>
              <form className="auth-form" onSubmit={submit}>
                {user ? (
                  <p className="muted-text">
                    Signed in as <strong>{user.email}</strong>.
                  </p>
                ) : (
                  <>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" autoComplete="email" required />
                    <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" type="password" autoComplete="current-password" required />
                  </>
                )}
                <label className="terms-row">
                  <input type="checkbox" checked={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.checked })} />
                  <span>I understand my account and data will be deleted for good.</span>
                </label>
                {error && <p className="error-text">{error}</p>}
                <button className="danger-button" type="submit" disabled={busy}>
                  {busy ? 'Deleting…' : 'Delete my account'}
                </button>
              </form>
              <p className="muted-text">
                Can’t sign in? Email <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20account`}>{SUPPORT_EMAIL}</a> from your account email
                with the subject “Delete my account”.
              </p>
            </>
          )}
        </section>
        <SiteFooter />
      </main>
    </div>
  )
}
