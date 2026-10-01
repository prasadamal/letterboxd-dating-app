import { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const API_BASE = '/api'

function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function apiFetch(path, options = {}, token = localStorage.getItem('reelmates_token')) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(token),
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }

  return res.json()
}

function AuthScreen({ onAuth }) {
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
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form

      const data = await apiFetch(`/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      localStorage.setItem('reelmates_token', data.token)
      onAuth(data.user)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card-panel">
        <div className="brand-wrap auth-brand">
          <div className="brand-mark">RM</div>
          <div>
            <p className="eyebrow">movie dating</p>
            <h1>ReelMates</h1>
          </div>
        </div>

        <div className="auth-toggle">
          <button className={mode === 'login' ? 'nav-pill active' : 'nav-pill'} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'signup' ? 'nav-pill active' : 'nav-pill'} onClick={() => setMode('signup')}>Sign up</button>
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

function buildTasteSummary(user, match) {
  if (!user || !match) return 'Taste vibe is still being discovered.'

  const sharedLoved = (match.loved || []).filter((movie) => (user.loved || []).includes(movie)).slice(0, 2)
  const sharedHated = (match.hated || []).filter((movie) => (user.hated || []).includes(movie)).slice(0, 2)
  const parts = []

  if (sharedLoved.length) parts.push(`Loved: ${sharedLoved.join(' and ')} like you`)
  if (sharedHated.length) parts.push(`Hated: ${sharedHated.join(' and ')} like you`)

  return parts.join(' · ') || 'Different taste, but definitely interesting.'
}

function Dashboard({ user, setUser }) {
  const [tab, setTab] = useState('discover')
  const [movies, setMovies] = useState([])
  const [matches, setMatches] = useState([])
  const [profile, setProfile] = useState(user)

  useEffect(() => {
    async function loadData() {
      try {
        const [moviesData, matchesData, profileData] = await Promise.all([
          apiFetch('/movies/daily', {}, localStorage.getItem('reelmates_token')),
          apiFetch('/matches', {}, localStorage.getItem('reelmates_token')),
          apiFetch('/users/profile', {}, localStorage.getItem('reelmates_token'))
        ])

        setMovies(moviesData.movies || [])
        setMatches(matchesData.matches || [])
        setProfile(profileData.user || user)
        setUser(profileData.user || user)
      } catch (err) {
        console.error(err)
      }
    }

    loadData()
  }, [])

  async function rateMovie(movie, reaction) {
    try {
      const data = await apiFetch(`/movies/${movie.id}/rate`, {
        method: 'POST',
        body: JSON.stringify({ reaction })
      }, localStorage.getItem('reelmates_token'))

      setUser(data.user)
      setProfile(data.user)
      const freshMatches = await apiFetch('/matches', {}, localStorage.getItem('reelmates_token'))
      setMatches(freshMatches.matches || [])
      setMovies((current) => current.filter((item) => item.id !== movie.id))
    } catch (err) {
      console.error(err)
    }
  }

  const topMatch = useMemo(() => [...matches].sort((a, b) => b.score - a.score)[0], [matches])

  async function handleSaveProfile(e) {
    e.preventDefault()
    try {
      const form = new FormData(e.currentTarget)
      const payload = {
        name: form.get('name'),
        city: form.get('city'),
        bio: form.get('bio'),
        hobbies: form.get('hobbies')?.toString().split(',').map((item) => item.trim()).filter(Boolean) || []
      }

      const data = await apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }, localStorage.getItem('reelmates_token'))
      setUser(data.user)
      setProfile(data.user)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">RM</div>
          <div>
            <p className="eyebrow">movie dating</p>
            <h1>ReelMates</h1>
          </div>
        </div>

        <nav className="nav">
          {['discover', 'matches', 'profile'].map((name) => (
            <button key={name} className={tab === name ? 'nav-pill active' : 'nav-pill'} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </nav>

        <button className="primary-button small" onClick={() => {
          localStorage.removeItem('reelmates_token')
          window.location.reload()
        }}>
          Log out
        </button>
      </header>

      <main className="page-grid">
        <section className="hero card-panel">
          <div className="hero-copy">
            <p className="eyebrow accent">Curated by taste</p>
            <h2>Meet people who love your kind of cinema.</h2>
            <p className="hero-text">
              Rate the movies you love and hate, build a movie taste profile, and discover people who share your favorite film instincts.
            </p>

            <div className="cta-row">
              <button className="primary-button" onClick={() => setTab('discover')}>Start matching</button>
              <button className="ghost-button" onClick={() => setTab('profile')}>See my profile</button>
            </div>

            <div className="stat-row">
              <div>
                <strong>{matches.length}</strong>
                <span>potential matches</span>
              </div>
              <div>
                <strong>{(profile.loved || []).length}</strong>
                <span>loved titles</span>
              </div>
              <div>
                <strong>{topMatch ? `${Math.round(topMatch.score)}%` : '0%'}</strong>
                <span>best compatibility</span>
              </div>
            </div>
          </div>

          <div className="profile-mini card-panel">
            <div className="avatar-ring">
              <img src={profile.avatar_url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'} alt={profile.name} />
            </div>
            <div className="mini-meta">
              <p className="eyebrow accent">Your taste profile</p>
              <h3>{profile.name}, {profile.age}</h3>
              <p>{profile.city} · {(profile.hobbies || [])[0]}</p>
            </div>
            <div className="taste-tags">
              {(profile.hobbies || []).slice(0, 3).map((hobby) => <span key={hobby}>{hobby}</span>)}
            </div>
          </div>
        </section>

        <aside className="sidebar card-panel">
          <div className="sidebar-head">
            <p className="eyebrow accent">Top match</p>
            <h3>{topMatch ? `${Math.round(topMatch.score)}%` : '0%'}</h3>
          </div>

          <div className="meter">
            <span style={{ width: `${topMatch ? topMatch.score : 0}%` }} />
          </div>

          {topMatch && (
            <div className="match-card compact">
              <img src={topMatch.avatar_url} alt={topMatch.name} />
              <div>
                <h4>{topMatch.name}</h4>
                <p>{topMatch.city}</p>
              </div>
            </div>
          )}

          <div className="taste-box">
            <h4>Taste match</h4>
            <p>{topMatch ? buildTasteSummary(profile, topMatch) : 'No match yet.'}</p>
          </div>
        </aside>

        {tab === 'discover' && (
          <section className="discover card-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow accent">Daily movie rating</p>
                <h3>What are you in the mood for?</h3>
              </div>
            </div>

            <div className="movie-grid">
              {movies.map((movie) => (
                <article className="movie-card" key={movie.id}>
                  <div className="movie-topline">
                    <span>{movie.genre}</span>
                    <span>{movie.mood}</span>
                  </div>
                  <h4>{movie.title}</h4>
                  <p className="movie-description">{movie.description}</p>
                  <div className="movie-actions">
                    <button className="ghost-button" onClick={() => rateMovie(movie, 'hate')}>Hate</button>
                    <button className="primary-button" onClick={() => rateMovie(movie, 'love')}>Love</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'matches' && (
          <section className="matches-list">
            <div className="section-head">
              <div>
                <p className="eyebrow accent">Matched by taste</p>
                <h3>People with similar movie instincts</h3>
              </div>
            </div>

            <div className="card-grid">
              {(matches || []).map((person) => (
                <article key={person.id} className="person-card card-panel">
                  <div className="person-image-wrap">
                    <img src={person.avatar_url} alt={person.name} />
                    <span className="score-badge">{Math.round(person.score)}% match</span>
                  </div>

                  <div className="person-body">
                    <div className="identity-row">
                      <div>
                        <h4>{person.name}, {person.age}</h4>
                        <p>{person.city}</p>
                      </div>
                      <span className="label-chip">{(person.hobbies || [])[0]}</span>
                    </div>

                    <p className="bio">{person.bio}</p>

                    <div className="taste-quote">
                      <strong>Movie taste</strong>
                      <p>{buildTasteSummary(profile, person)}</p>
                    </div>

                    <div className="favorite-lists">
                      <div>
                        <span>Loved</span>
                        <p>{(person.loved || []).slice(0, 2).join(' · ')}</p>
                      </div>
                      <div>
                        <span>Hated</span>
                        <p>{(person.hated || []).slice(0, 2).join(' · ')}</p>
                      </div>
                    </div>

                    <div className="action-row">
                      <button className="ghost-button">Pass</button>
                      <button className="primary-button" onClick={() => apiFetch(`/matches/${person.id}/like`, { method: 'POST' })}>Message</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'profile' && (
          <section className="profile-panel card-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow accent">Your movie profile</p>
                <h3>{profile.name}</h3>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-editor">
              <div className="profile-grid">
                <div className="profile-summary">
                  <img src={profile.avatar_url || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'} alt={profile.name} />
                  <div>
                    <h4>{profile.name}, {profile.age}</h4>
                    <p>{profile.city}</p>
                  </div>
                </div>

                <div className="profile-details">
                  <input name="name" defaultValue={profile.name} />
                  <input name="city" defaultValue={profile.city} />
                  <textarea name="bio" defaultValue={profile.bio} rows="4" />
                  <input name="hobbies" defaultValue={(profile.hobbies || []).join(', ')} placeholder="Hobbies, comma-separated" />
                  <button type="submit" className="primary-button">Save profile</button>
                </div>
              </div>
            </form>

            <div className="taste-columns">
              <div className="taste-block">
                <h4>Loved</h4>
                <ul>
                  {(profile.loved || []).map((movie) => <li key={movie}>{movie}</li>)}
                </ul>
              </div>

              <div className="taste-block">
                <h4>Hated</h4>
                <ul>
                  {(profile.hated || []).map((movie) => <li key={movie}>{movie}</li>)}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem('reelmates_token')
      if (!token) {
        setReady(true)
        return
      }

      try {
        const data = await apiFetch('/auth/me', {}, token)
        setUser(data.user)
      } catch (err) {
        localStorage.removeItem('reelmates_token')
      } finally {
        setReady(true)
      }
    }

    bootstrap()
  }, [])

  if (!ready) return <div className="loading">Loading ReelMates…</div>
  if (!user) return <AuthScreen onAuth={setUser} />

  return <Dashboard user={user} setUser={setUser} />
}
