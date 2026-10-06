import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'

// Public taste card shared from the app (Profile → Share my taste card). No sign-in needed.
export default function TasteCardPage({ signedIn }) {
  const { code } = useParams()
  const [card, setCard] = useState(null)
  const [error, setError] = useState('')

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

  return (
    <div className="auth-shell">
      <section className="auth-card taste-card">
        <BrandMark />
        {error && (
          <>
            <h1>This taste card isn't available</h1>
            <p className="hero-text">It may have been made private. You can still join and build your own.</p>
          </>
        )}
        {!card && !error && <p className="hero-text">Loading taste card…</p>}
        {card && (
          <>
            <p className="eyebrow accent">FILM TASTE</p>
            <h1>{card.name}'s taste card</h1>
            {card.favorite && (
              <div className="taste-favorite">
                <span>All-time favourite</span>
                <strong>{card.favorite}</strong>
              </div>
            )}
            {card.prompts?.[0] && (
              <div className="taste-favorite">
                <span>{card.prompts[0].question}</span>
                <strong>{card.prompts[0].answer}</strong>
              </div>
            )}
            {card.rarestLiked.length > 0 && (
              <>
                <p className="eyebrow">RAREST FILMS THEY LIKED</p>
                <ul className="taste-chips">
                  {card.rarestLiked.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="hero-text">
              {card.liked} liked · {card.disliked} disliked
              {card.topGenres.length ? ` · loves ${card.topGenres.join(', ')}` : ''}
              {card.bestStreak > 1 ? ` · best streak ${card.bestStreak} days` : ''}
            </p>
            <div className="taste-cta">
              <p>
                How well does your taste match? Get ReelMates, play the daily film game, then add <strong>{card.code}</strong> in
                Film friends to compare.
              </p>
              <Link className="primary-button" to="/">
                {signedIn ? 'Open ReelMates' : 'Join ReelMates'}
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
