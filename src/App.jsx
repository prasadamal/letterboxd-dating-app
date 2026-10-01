import { useMemo, useState } from 'react'

const userProfile = {
  name: 'Maya',
  age: 27,
  city: 'Brooklyn',
  vibe: 'Night-owl cinephile',
  topMovies: ['La La Land', 'Spirited Away', 'Moonlight', 'The Social Network'],
  topSeries: ['The Bear', 'Severance', 'The Queen’s Gambit'],
  genres: ['Romance', 'Indie', 'Sci‑Fi', 'Thriller']
}

const profiles = [
  {
    id: 1,
    name: 'Ari',
    age: 29,
    city: 'Austin',
    vibe: 'Aesthetic chaos and cutthroat cinema',
    bio: 'Collects midnight screenings, hosts watch parties, and writes movie recs in the notes app.',
    topMovies: ['Moonlight', 'The Apartment', 'Past Lives', 'Portrait of a Lady on Fire'],
    topSeries: ['Severance', 'The Bear', 'Only Murders in the Building'],
    genres: ['Romance', 'Indie', 'Drama', 'Thriller'],
    distance: '2.1 mi away',
    badge: 'Letterboxd power user',
    score: 96,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 2,
    name: 'Jules',
    age: 31,
    city: 'Seattle',
    vibe: 'Sci-fi romantic with a stubborn heart',
    bio: 'Perfect for rainy date nights, improvised film trivia, and weirdly specific recommendations.',
    topMovies: ['Arrival', 'Her', 'Spirited Away', 'Before Sunset'],
    topSeries: ['The Leftovers', 'Dark', 'The Queen’s Gambit'],
    genres: ['Sci‑Fi', 'Romance', 'Drama', 'Mystery'],
    distance: '5.4 mi away',
    badge: 'Argument-ready',
    score: 92,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 3,
    name: 'Noah',
    age: 26,
    city: 'Chicago',
    vibe: 'Obsessed with comfort movies and heist plots',
    bio: 'Likes cozy dinners, weirdly good thrillers, and people who can quote The Grand Budapest Hotel.',
    topMovies: ['The Grand Budapest Hotel', 'The Social Network', 'The Nice Guys', 'Inception'],
    topSeries: ['The Bear', 'Fargo', 'Silo'],
    genres: ['Comedy', 'Thriller', 'Indie', 'Action'],
    distance: '8.7 mi away',
    badge: 'Watch-party legend',
    score: 88,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 4,
    name: 'Lena',
    age: 28,
    city: 'Denver',
    vibe: 'Sweaters and sunsets, with a love for noir',
    bio: 'If you love slow-burn romances, moody cinematography, and unexpectedly deep podcasts, we’ll get along.',
    topMovies: ['La La Land', 'The Third Man', 'The Apartment', 'Anora'],
    topSeries: ['Severance', 'The Last of Us', 'The White Lotus'],
    genres: ['Romance', 'Drama', 'Mystery', 'Indie'],
    distance: '4.3 mi away',
    badge: 'Cinematic match',
    score: 90,
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80'
  }
]

function getCompatibility(profile) {
  const userGenres = new Set(userProfile.genres)
  const profileGenres = new Set(profile.genres)
  const sharedGenres = [...profileGenres].filter((genre) => userGenres.has(genre)).length

  const commonMovies = profile.topMovies.filter((movie) => userProfile.topMovies.includes(movie)).length
  const commonSeries = profile.topSeries.filter((series) => userProfile.topSeries.includes(series)).length

  const score = Math.min(99, 60 + sharedGenres * 10 + commonMovies * 7 + commonSeries * 8)
  return Math.round(score)
}

const defaultProfiles = profiles.map((profile) => ({
  ...profile,
  score: getCompatibility(profile)
}))

export default function App() {
  const [matches, setMatches] = useState(defaultProfiles)
  const [activeTab, setActiveTab] = useState('Discover')

  const topMatch = useMemo(() => [...matches].sort((a, b) => b.score - a.score)[0], [matches])
  const likedCount = matches.filter((match) => match.score >= 90).length
  const sharedTaste = `${Math.min(98, 62 + likedCount * 7)}%`

  const handleAction = (id, target) => {
    setMatches((current) =>
      current.map((match) =>
        match.id === id
          ? { ...match, action: target }
          : match
      )
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">RM</div>
          <div>
            <p className="eyebrow">dating app</p>
            <h1>ReelMates</h1>
          </div>
        </div>

        <nav className="nav">
          {['Discover', 'Matches', 'Profile'].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'nav-pill active' : 'nav-pill'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <button className="primary-button small">Upgrade</button>
      </header>

      <main className="page-grid">
        <section className="hero card-panel">
          <div className="hero-copy">
            <p className="eyebrow accent">Find your soulmate in the credits roll</p>
            <h2>Meet people who love your kind of cinema.</h2>
            <p className="hero-text">
              ReelMates matches you by movie chemistry, series overlap, and the little things that make a date feel effortless.
            </p>

            <div className="cta-row">
              <button className="primary-button">Start matching</button>
              <button className="ghost-button">View my vibe</button>
            </div>

            <div className="stat-row">
              <div>
                <strong>12k+</strong>
                <span>compatibility checks</span>
              </div>
              <div>
                <strong>{likedCount}+</strong>
                <span>curated matches</span>
              </div>
              <div>
                <strong>{sharedTaste}</strong>
                <span>shared taste</span>
              </div>
            </div>
          </div>

          <div className="mini-profile card-panel inner-panel">
            <div className="avatar-ring">
              <div className="avatar-photo" />
            </div>
            <div className="mini-meta">
              <p className="eyebrow accent">Your vibe</p>
              <h3>{userProfile.name}, {userProfile.age}</h3>
              <p>{userProfile.city} · {userProfile.vibe}</p>
            </div>
            <div className="taste-tags">
              {userProfile.genres.map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>
          </div>
        </section>

        <aside className="sidebar card-panel">
          <div className="sidebar-head">
            <p className="eyebrow accent">Match meter</p>
            <h3>{topMatch?.score}%</h3>
          </div>

          <div className="meter">
            <span style={{ width: `${topMatch?.score || 0}%` }} />
          </div>

          <div className="match-card compact">
            <img src={topMatch?.image} alt={topMatch?.name} />
            <div>
              <h4>{topMatch?.name}</h4>
              <p>{topMatch?.vibe}</p>
            </div>
          </div>

          <ul className="watchlist-list">
            {userProfile.topMovies.map((movie) => (
              <li key={movie}>{movie}</li>
            ))}
          </ul>
        </aside>

        <section className="discover-section">
          <div className="section-head">
            <div>
              <p className="eyebrow accent">Based on your watchlist</p>
              <h3>High-chemistry matches</h3>
            </div>
            <button className="ghost-button">Filter</button>
          </div>

          <div className="card-grid">
            {matches.map((person) => (
              <article key={person.id} className="person-card card-panel">
                <div className="person-image-wrap">
                  <img src={person.image} alt={person.name} />
                  <span className="score-badge">{person.score}% match</span>
                </div>

                <div className="person-body">
                  <div className="identity-row">
                    <div>
                      <h4>{person.name}, {person.age}</h4>
                      <p>{person.city} · {person.distance}</p>
                    </div>
                    <span className="label-chip">{person.badge}</span>
                  </div>

                  <p className="bio">{person.bio}</p>

                  <div className="genre-row">
                    {person.genres.map((genre) => (
                      <span key={`${person.id}-${genre}`}>{genre}</span>
                    ))}
                  </div>

                  <div className="favorite-lists">
                    <div>
                      <span>Movies</span>
                      <p>{person.topMovies.slice(0, 2).join(' · ')}</p>
                    </div>
                    <div>
                      <span>Series</span>
                      <p>{person.topSeries.slice(0, 2).join(' · ')}</p>
                    </div>
                  </div>

                  <div className="action-row">
                    <button className="ghost-button" onClick={() => handleAction(person.id, 'skip')}>
                      Pass
                    </button>
                    <button className="primary-button" onClick={() => handleAction(person.id, 'like')}>
                      Like
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
