import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'
import { apiFetch, clearToken, getRefreshToken } from '../lib/api.js'
import { APP_STORE_URL, PLAY_URL } from '../lib/site.js'

// What signed-in visitors see on the website. The full ReelMates experience is the app.
export default function AccountPage({ user }) {
  async function logOut() {
    const refreshToken = getRefreshToken()
    if (refreshToken) await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => null)
    clearToken()
    window.location.assign('/')
  }

  return (
    <div className="site-page">
      <main className="site-column">
        <header className="taste-top account-top">
          <BrandMark />
          <button type="button" className="text-button" onClick={logOut}>
            Log out
          </button>
        </header>
        <section className="panel account-hero">
          <span className="account-emoji" aria-hidden="true">
            🎬
          </span>
          <h1 className="panel-title">You’re in, {user.name?.split(' ')[0] || 'film fan'}.</h1>
          <p className="muted-text">
            ReelMates lives on your phone: swipe today’s 10 films, meet your film people and chat. Sign in there with this email.
          </p>
          <div className="store-row">
            {PLAY_URL ? (
              <a className="primary-button" href={PLAY_URL}>
                Get it on Google Play
              </a>
            ) : (
              <span className="ghost-button">Android: coming soon</span>
            )}
            {APP_STORE_URL ? (
              <a className="primary-button" href={APP_STORE_URL}>
                Download on the App Store
              </a>
            ) : (
              <span className="ghost-button">iPhone: coming soon</span>
            )}
          </div>
        </section>
        {user.referral_code && (
          <section className="panel">
            <p className="panel-label">Your friend code</p>
            <p className="favorite-title">{user.referral_code}</p>
            <p className="muted-text">
              Friends add it in the app to compare taste. Share your taste card from the app (You → Share my taste card) and it appears at{' '}
              <Link to={`/taste/${user.referral_code}`}>/taste/{user.referral_code}</Link>.
            </p>
          </section>
        )}
        <section className="panel">
          <p className="panel-label">Dating</p>
          <p className="muted-text">
            Dating opens city by city. <Link to="/cities">See which cities are close</Link>.
          </p>
        </section>
        <SiteFooter />
      </main>
    </div>
  )
}
