import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'
import { Poster } from '../components/Poster.jsx'

const NEUTRAL = ['#2A2A35', '#55556B']

// Public taste card shared from the app (You → Share my taste card). No sign-in needed.
export default function TasteCardPage({ signedIn }) {
  const { code } = useParams()
  const [card, setCard] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/public/taste/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Taste card not found')
        setCard(data.card)
        document.title = `${data.card.name}'s film taste · ReelMates`
      })
      .catch((err) => setError(err.message))
  }, [code])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(card.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const persona = card?.personality
  const [from, to] = persona?.colors || NEUTRAL

  return (
    <div className="taste-page">
      <main className="taste-column">
        <header className="taste-top">
          <BrandMark />
        </header>

        {error && (
          <section className="panel">
            <h1 className="panel-title">This taste card isn't available</h1>
            <p className="muted-text">It may have been made private. You can still join and build your own.</p>
            <Link className="primary-button" to="/">
              Join ReelMates
            </Link>
          </section>
        )}
        {!card && !error && <p className="muted-text">Loading taste card…</p>}

        {card && (
          <>
            <section className="persona-card" style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}>
              <span className="persona-kicker">{persona ? 'Film personality' : 'Film taste'}</span>
              <span className="persona-emoji" aria-hidden="true">
                {persona?.emoji || '🎬'}
              </span>
              <p className="persona-lead">{persona ? `${card.name} is a` : `${card.name}'s`}</p>
              <h1 className="persona-name">{persona ? persona.name : 'taste card'}</h1>
              {persona?.tagline && <p className="persona-tagline">{persona.tagline}</p>}
              {persona?.traits?.length > 0 && (
                <ul className="trait-chips">
                  {persona.traits.map((trait) => (
                    <li key={trait}>{trait}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="stat-tiles">
              <div className="stat-tile">
                <strong>{card.liked}</strong>
                <span>loved</span>
              </div>
              <div className="stat-tile">
                <strong>{card.disliked}</strong>
                <span>not for them</span>
              </div>
              {card.bestStreak > 0 && (
                <div className="stat-tile">
                  <strong>🔥 {card.bestStreak}</strong>
                  <span>best streak</span>
                </div>
              )}
            </section>

            {card.favoriteFilm && (
              <section className="panel favorite-row">
                <Poster film={card.favoriteFilm} width={92} />
                <div>
                  <p className="panel-label">All-time favourite</p>
                  <p className="favorite-title">{card.favoriteFilm.title}</p>
                  <p className="muted-text">
                    {[card.favoriteFilm.year, card.favoriteFilm.genres?.slice(0, 2).join(' · ')].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </section>
            )}

            {card.rarestFilms?.length > 0 && (
              <section className="panel">
                <p className="panel-label">Rarest films {card.name} loves</p>
                <div className="poster-row">
                  {card.rarestFilms.map((film) => (
                    <Poster key={film.id} film={film} width={112} />
                  ))}
                </div>
              </section>
            )}

            {(card.topGenres.length > 0 || card.prompts?.[0]) && (
              <section className="panel">
                {card.topGenres.length > 0 && (
                  <>
                    <p className="panel-label">Into</p>
                    <ul className="genre-chips">
                      {card.topGenres.map((genre) => (
                        <li key={genre}>{genre}</li>
                      ))}
                    </ul>
                  </>
                )}
                {card.prompts?.[0] && (
                  <div className="prompt-block">
                    <p className="muted-text">{card.prompts[0].question}</p>
                    <p className="prompt-answer">{card.prompts[0].answer}</p>
                  </div>
                )}
              </section>
            )}

            <section className="cta-card">
              <h2>How well do your tastes match?</h2>
              <p>
                Swipe today's 10 films on ReelMates, then add {card.name}'s friend code in Film friends to see your match.
              </p>
              <div className="code-pill">
                <span>{card.code}</span>
                <button type="button" onClick={copyCode}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <Link className="dark-button" to="/">
                {signedIn ? 'Open ReelMates' : 'Join ReelMates'}
              </Link>
            </section>
            <p className="fine-print">Only what {card.name} chose to share. No photo, age or location.</p>
          </>
        )}
      </main>
    </div>
  )
}
