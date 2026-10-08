import { useEffect, useState } from 'react'
import { apiFetch, setSession } from '../lib/api.js'
import { BrandMark } from '../components/BrandMark.jsx'
import { Poster } from '../components/Poster.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'

const IDENTITIES = [
  ['female', 'Woman'],
  ['male', 'Man'],
  ['nonbinary', 'Non-binary']
]
const SHOW_ME = [
  ['female', 'Women'],
  ['male', 'Men'],
  ['nonbinary', 'Non-binary people']
]

// Mirrors server/lib/datingEligibility.js defaultInterestedIn.
function defaultInterestedIn(gender) {
  if (gender === 'male') return ['female']
  if (gender === 'female') return ['male']
  return ['male', 'female', 'nonbinary']
}

// Short words only, so the titles fit the small posters on phones.
const SHOWCASE = [
  { id: 1, title: 'Parasite', year: 2019, genres: ['Thriller'] },
  { id: 2, title: 'Spirited Away', year: 2001, genres: ['Animation'] },
  { id: 3, title: 'Drishyam', year: 2013, genres: ['Crime'] },
  { id: 4, title: 'Before Sunrise', year: 1995, genres: ['Romance'] },
  { id: 5, title: 'Arrival', year: 2016, genres: ['Sci-Fi'] }
]

function useNarrow(query = '(max-width: 600px)') {
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setNarrow(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return narrow
}

// Launch cities first; the server resolves other spellings (Cochin → Kochi).
const INDIA_CITIES = ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Bengaluru', 'Chennai', 'Hyderabad', 'Mumbai', 'Delhi']

const EMPTY_FORM = {
  email: '',
  password: '',
  name: '',
  age: '',
  city: '',
  country: '',
  datingEnabled: false,
  gender: '',
  interestedIn: [],
  referralCode: '',
  termsAccepted: false
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('signup')
  const [notice, setNotice] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const narrow = useNarrow()

  const update = (patch) => setForm((current) => ({ ...current, ...patch }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'signup' && form.datingEnabled && !form.gender) {
      setError('Choose how you identify to use dating, or pick Films & friends.')
      return
    }
    if (mode === 'signup' && form.datingEnabled && form.city.trim().length < 2) {
      setError('Add your city: dating opens city by city.')
      return
    }

    const payload =
      mode === 'login'
        ? { email: form.email, password: form.password }
        : {
            email: form.email,
            password: form.password,
            name: form.name.trim(),
            age: Number(form.age),
            country: form.country.trim(),
            datingEnabled: form.datingEnabled,
            ...(form.datingEnabled ? { city: form.city.trim() } : {}),
            ...(form.datingEnabled ? { gender: form.gender, interestedIn: form.interestedIn } : {}),
            ...(form.referralCode.trim() ? { referralCode: form.referralCode.trim().toUpperCase() } : {}),
            termsAccepted: form.termsAccepted === true
          }

    setBusy(true)
    try {
      const data = await apiFetch(`/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      setSession(data.token, data.refreshToken)
      onAuth(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
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

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  return (
    <div className="landing">
      <section className="landing-hero">
        <BrandMark />
        <h1 className="landing-title">Find your film people.</h1>
        <p className="landing-sub">
          Swipe 10 films a day, see how everyone else voted, discover your film personality, and meet friends (and dates, if
          you want) who get your taste.
        </p>
        <div className="poster-fan" aria-hidden="true">
          {SHOWCASE.map((film) => (
            <Poster key={film.id} film={film} width={narrow ? 80 : 118} />
          ))}
        </div>
        <ul className="feature-chips">
          <li>🎬 10 films a day</li>
          <li>🧬 Your film personality</li>
          <li>👯 Film friends</li>
          <li>💘 Dating, if you want it</li>
        </ul>
      </section>

      <section className="auth-card">
        {mode !== 'forgot' && (
          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>
              Sign up
            </button>
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              Log in
            </button>
          </div>
        )}

        {mode === 'forgot' ? (
          <form className="auth-form" onSubmit={forgot}>
            <h2 className="form-title">Reset your password</h2>
            <p className="muted-text">We'll email you a link to choose a new one.</p>
            <input value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="Email" type="email" autoComplete="email" required />
            {error && <p className="error-text">{error}</p>}
            {notice && <p className="muted-text">{notice}</p>}
            {devResetUrl && (
              <p className="muted-text">
                Dev reset link: <a href={devResetUrl}>{devResetUrl}</a>
              </p>
            )}
            <button className="primary-button" type="submit">
              Send reset link
            </button>
            <button type="button" className="text-button" onClick={() => switchMode('login')}>
              Back to log in
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <>
                <div className="field-row">
                  <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="First name" autoComplete="given-name" required minLength={2} />
                  <input value={form.age} onChange={(e) => update({ age: e.target.value })} placeholder="Age" type="number" min={18} max={100} required className="age-input" />
                </div>
                <input value={form.country} onChange={(e) => update({ country: e.target.value })} placeholder="Country" autoComplete="country-name" required />

                <fieldset className="choice-group">
                  <legend>I'm here for</legend>
                  <div className="choice-cards">
                    <button type="button" className={!form.datingEnabled ? 'choice active' : 'choice'} aria-pressed={!form.datingEnabled} onClick={() => update({ datingEnabled: false })}>
                      <span className="choice-emoji">🎬</span>
                      <strong>Films & friends</strong>
                      <small>Daily films, taste matches and friends</small>
                    </button>
                    <button type="button" className={form.datingEnabled ? 'choice active' : 'choice'} aria-pressed={form.datingEnabled} onClick={() => update({ datingEnabled: true })}>
                      <span className="choice-emoji">💘</span>
                      <strong>Dating too</strong>
                      <small>Also meet people to date</small>
                    </button>
                  </div>
                </fieldset>

                {form.datingEnabled && (
                  <>
                    <fieldset className="choice-group">
                      <legend>Your city</legend>
                      <input value={form.city} onChange={(e) => update({ city: e.target.value })} placeholder="City" autoComplete="address-level2" />
                      {form.country.trim().toLowerCase() === 'india' && (
                        <div className="pill-options">
                          {INDIA_CITIES.map((city) => (
                            <button key={city} type="button" className={form.city.trim().toLowerCase() === city.toLowerCase() ? 'pill active' : 'pill'} onClick={() => update({ city })}>
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="field-hint">Dating opens city by city, once enough people join.</p>
                    </fieldset>
                    <fieldset className="choice-group">
                      <legend>I am</legend>
                      <div className="pill-options">
                        {IDENTITIES.map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={form.gender === value ? 'pill active' : 'pill'}
                            aria-pressed={form.gender === value}
                            onClick={() => update({ gender: value, interestedIn: defaultInterestedIn(value) })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    {form.gender && (
                      <fieldset className="choice-group">
                        <legend>Show me</legend>
                        <div className="pill-options">
                          {SHOW_ME.map(([value, label]) => {
                            const on = form.interestedIn.includes(value)
                            return (
                              <button
                                key={value}
                                type="button"
                                className={on ? 'pill active' : 'pill'}
                                aria-pressed={on}
                                onClick={() => {
                                  const next = on ? form.interestedIn.filter((v) => v !== value) : [...form.interestedIn, value]
                                  if (next.length) update({ interestedIn: next })
                                }}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>
                    )}
                  </>
                )}
              </>
            )}

            <input value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="Email" type="email" autoComplete="email" required />
            <input
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder={mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 8 : 1}
              required
            />

            {mode === 'signup' && (
              <>
                <input
                  value={form.referralCode}
                  onChange={(e) => update({ referralCode: e.target.value })}
                  placeholder="Friend code (optional)"
                  autoCapitalize="characters"
                />
                <label className="terms-row">
                  <input type="checkbox" checked={form.termsAccepted} onChange={(e) => update({ termsAccepted: e.target.checked })} required />
                  <span>
                    I'm 18+ and accept the{' '}
                    <a href="/terms" target="_blank" rel="noreferrer">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </>
            )}

            {error && <p className="error-text">{error}</p>}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'One sec…' : mode === 'login' ? 'Log in' : 'Create my account'}
            </button>
            {mode === 'login' && (
              <button type="button" className="text-button" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            )}
          </form>
        )}
            </section>
      <div className="landing-footer">
        <SiteFooter />
      </div>
    </div>
  )
}
