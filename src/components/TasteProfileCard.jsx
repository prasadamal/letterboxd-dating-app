import { buildTasteSummary } from '../lib/api.js'

export function TasteProfileCard({ user, person, compact = false }) {
  return (
    <article className={`taste-profile-card ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="person-image-wrap">
          <img src={person.avatar_url} alt={person.name} />
          <span className="score-badge">{Math.round(person.score)}% match</span>
        </div>
      )}

      <div className="person-body">
        <div className="identity-row">
          <div>
            <h4>
              {person.name}, {person.age}
            </h4>
            <p>{person.city || person.country}</p>
          </div>
        </div>

        {person.bio && <p className="bio">{person.bio}</p>}

        <div className="taste-quote">
          <strong>Movie taste</strong>
          <p>{person.likedLine || person.dislikedLine ? [person.likedLine, person.dislikedLine].filter(Boolean).join(' · ') : buildTasteSummary(user, person)}</p>
        </div>

        {!compact && (
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
        )}
      </div>
    </article>
  )
}
