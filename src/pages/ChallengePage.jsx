import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'
import { Poster } from '../components/Poster.jsx'
import { getToken } from '../lib/api.js'

const CHOICES = [
  { value: 'love', label: 'Liked', icon: '♥' },
  { value: 'hate', label: "Didn't", icon: '✕' },
  { value: 'skip', label: "Haven't seen", icon: '–' }
]
const WORD = { love: 'Liked', hate: "Didn't like", skip: "Haven't seen" }
const storageKey = (code) => `reelmates_challenge_${code}`

function remembered(code) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(code)) || 'null')
  } catch {
    return null
  }
}

// A friend's taste challenge (/c/<code>): answer the same ten films, then see how connected you are.
// Works without an account; a signed-in member's answer is linked to them.
export default function ChallengePage() {
  const { code } = useParams()
  const [challenge, setChallenge] = useState(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [answers, setAnswers] = useState({})
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(() => remembered(code))
  const [shared, setShared] = useState('')

  useEffect(() => {
    fetch(`/api/v1/public/challenges/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Challenge not found')
        setChallenge(data.challenge)
        document.title = `${data.challenge.name}'s film challenge · ReelMates`
      })
      .catch((err) => setError(err.message))
  }, [code])

  const films = challenge?.films || []
  const answered = films.filter((f) => answers[f.id]).length
  const ready = films.length > 0 && answered === films.length && name.trim().length > 0
  const filmById = useMemo(() => new Map(films.map((f) => [f.id, f])), [films])

  async function submit(event) {
    event.preventDefault()
    if (!ready || sending) return
    setSending(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`/api/v1/public/challenges/${encodeURIComponent(code)}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: name.trim(), answers })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Could not send your answers. Try again.')
      setResult(data.result)
      try {
        localStorage.setItem(storageKey(code), JSON.stringify(data.result))
      } catch {
        // Private browsing: the result just won't be remembered on this device.
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function shareResult() {
    const url = window.location.href
    const text = `${result.owner} and I are ${result.score}% connected on ReelMates: ${result.verdict.title}. Take the challenge 🎬`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ReelMates film challenge', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setShared('Copied. Paste it anywhere.')
    } catch {
      setShared('')
    }
  }

  const titleOf = (id) => result?.filmsInfo?.find((f) => f.id === id)?.title || filmById.get(id)?.title || ''

  return (
    <div className="taste-page">
      <main className="taste-column">
        <header className="taste-top">
          <BrandMark />
        </header>

        {error && !challenge && (
          <section className="panel">
            <h1 className="panel-title">This challenge isn't available</h1>
            <p className="muted-text">The link may be mistyped, or the person who shared it left ReelMates.</p>
            <Link className="primary-button" to="/">
              Make your own on ReelMates
            </Link>
          </section>
        )}
        {!challenge && !error && <p className="muted-text">Loading the challenge…</p>}

        {challenge && result && (
          <>
            <section className="score-hero" aria-live="polite">
              <span className="persona-kicker">You and {result.owner}</span>
              <strong className="score-number">{result.score}%</strong>
              <h1 className="persona-name">{result.verdict.title}</h1>
              <p className="persona-tagline">{result.verdict.line}</p>
              <p className="score-sub">
                Same answer on {result.same} of {result.total} films
              </p>
            </section>

            <section className="panel">
              <p className="panel-label">Film by film</p>
              <ul className="compare-list">
                {result.films.map((f) => (
                  <li key={f.id} className={f.same ? 'compare-row same' : 'compare-row'}>
                    <span className="compare-title">{titleOf(f.id)}</span>
                    <span className="compare-answers">
                      You: {WORD[f.mine]} · {result.owner}: {WORD[f.theirs]}
                    </span>
                    <span className="compare-mark" aria-label={f.same ? 'Same answer' : 'Different answer'}>
                      {f.same ? '✓' : '≠'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {(result.watchNext?.forYou || result.watchNext?.together) && (
              <section className="panel">
                <p className="panel-label">Watch next</p>
                {result.watchNext.forYou && (
                  <p>
                    {result.owner} liked <strong>{titleOf(result.watchNext.forYou)}</strong> and you haven't seen it yet.
                  </p>
                )}
                {result.watchNext.together && (
                  <p>
                    Neither of you has seen <strong>{titleOf(result.watchNext.together)}</strong>. Watch it together?
                  </p>
                )}
              </section>
            )}

            <button type="button" className="primary-button" onClick={shareResult}>
              Share your result
            </button>
            {shared && <p className="muted-text">{shared}</p>}

            <section className="cta-card">
              <h2>Make your own challenge</h2>
              <p>Rate ten new films every day on ReelMates, see your film personality, and challenge anyone you like.</p>
              <Link className="dark-button" to="/">
                Get ReelMates
              </Link>
            </section>
          </>
        )}

        {challenge && !result && (
          <form className="challenge-form" onSubmit={submit}>
            <section className="persona-card challenge-intro">
              <span className="persona-kicker">ReelMates Daily #{challenge.number}</span>
              <h1 className="persona-name">{challenge.name} challenged you</h1>
              <p className="persona-tagline">
                Rate the same {films.length} films. You'll see {challenge.name}'s answers and how connected you are when you're done.
              </p>
            </section>

            <label className="panel name-field">
              <span className="panel-label">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="So they know who answered"
                autoComplete="given-name"
              />
            </label>

            {films.map((film, index) => (
              <section key={film.id} className="panel challenge-film">
                <Poster film={film} width={76} />
                <div className="challenge-film-body">
                  <span className="panel-label">
                    {index + 1} / {films.length}
                    {film.slot?.label ? ` · ${film.slot.label}` : ''}
                  </span>
                  <strong className="challenge-film-title">{film.title}</strong>
                  <span className="muted-text">
                    {[film.year, film.origin_language, film.genres?.[0], film.details?.runtime && `${film.details.runtime} min`].filter(Boolean).join(' · ')}
                  </span>
                  {(film.details?.director || film.details?.cast?.length > 0) && (
                    <span className="film-credits">
                      {[film.details.director && `Dir. ${film.details.director}`, film.details.cast?.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <div className="answer-buttons" role="radiogroup" aria-label={`Your answer for ${film.title}`}>
                    {CHOICES.map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        role="radio"
                        aria-checked={answers[film.id] === choice.value}
                        className={`answer-button ${choice.value}${answers[film.id] === choice.value ? ' active' : ''}`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [film.id]: choice.value }))}
                      >
                        <span aria-hidden="true">{choice.icon}</span> {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            <div className="challenge-submit">
              <p className="muted-text" aria-live="polite">
                {answered} of {films.length} answered{!name.trim() && answered === films.length ? ' · add your name above' : ''}
              </p>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="primary-button" disabled={!ready || sending}>
                {sending ? 'Comparing…' : `See how connected you are with ${challenge.name}`}
              </button>
              <p className="fine-print">Only your first name and these ten answers are shared with {challenge.name}.</p>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
