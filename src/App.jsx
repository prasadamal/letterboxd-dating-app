import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { apiFetch, clearToken, getToken } from './lib/api.js'
import AuthPage from './pages/AuthPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import TasteCardPage from './pages/TasteCardPage.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      const token = getToken()
      if (!token) {
        setReady(true)
        return
      }

      try {
        const data = await apiFetch('/auth/me', {}, token)
        setUser(data.user)
      } catch {
        clearToken()
      } finally {
        setReady(true)
      }
    }

    bootstrap()
  }, [])

  if (!ready) return <div className="loading">Loading ReelMates…</div>

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/taste/:code" element={<TasteCardPage signedIn={Boolean(user)} />} />
      <Route path="/*" element={user ? <DashboardPage user={user} setUser={setUser} /> : <AuthPage onAuth={setUser} />} />
    </Routes>
  )
}
