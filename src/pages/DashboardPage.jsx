import { useEffect, useMemo, useState } from 'react'
import { apiFetch, clearToken, getRefreshToken, getToken, movieLabel } from '../lib/api.js'
import { BrandMark } from '../components/BrandMark.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { TasteProfileCard } from '../components/TasteProfileCard.jsx'
import { ReportDialog } from '../components/ReportDialog.jsx'

export default function DashboardPage({ user, setUser }) {
  const [tab, setTab] = useState('discover')
  const [movies, setMovies] = useState([])
  const [matches, setMatches] = useState([])
  const [conversations, setConversations] = useState([])
  const [profile, setProfile] = useState(user)
  const [chatPeer, setChatPeer] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [platform, setPlatform] = useState(null)
  const [deck, setDeck] = useState(null)
  const [deckMessage, setDeckMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [chatNotice, setChatNotice] = useState('')
  const [chatError, setChatError] = useState('')
  const [reportTarget, setReportTarget] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken()
        const [moviesData, matchesData, profileData, inbox, platformData] = await Promise.all([
          apiFetch('/movies/daily', {}, token),
          apiFetch('/matches', {}, token),
          apiFetch('/users/profile', {}, token),
          apiFetch('/messages/conversations', {}, token).catch(() => ({ conversations: [] })),
          apiFetch('/platform/status', {}, null)
        ])

        setMovies(moviesData.movies || [])
        setMatches(matchesData.matches || [])
        setConversations(inbox.conversations || [])
        setProfile(profileData.user || user)
        setUser(profileData.user || user)
        setPlatform(platformData)
        setLoadError('')
        if (platformData?.datingLaunched) {
          await loadDeck()
        }
      } catch (err) {
        setLoadError(err.message || 'Could not load ReelMates')
      }
    }

    loadData()
  }, [])

  async function loadDeck() {
    try {
      const data = await apiFetch('/dating/deck', {}, getToken())
      setDeck(data.profile || null)
      setDeckMessage(data.profile ? '' : 'No new profiles in your deck right now.')
    } catch (err) {
      setDeck(null)
      setDeckMessage(err.message || 'Dating deck unavailable')
    }
  }

  async function swipe(action) {
    if (!deck) return
    try {
      const result = await apiFetch(
        '/dating/swipe',
        { method: 'POST', body: JSON.stringify({ targetId: deck.id, action }) },
        getToken()
      )
      if (result.matched) setDeckMessage('It’s a match — say hello in Messages.')
      await loadDeck()
      const freshMatches = await apiFetch('/dating/matches', {}, getToken()).catch(() => apiFetch('/matches', {}, getToken()))
      setMatches(freshMatches.matches || [])
    } catch (err) {
      setDeckMessage(err.message || 'Could not save swipe')
    }
  }

  async function rateMovie(movie, reaction) {
    try {
      const data = await apiFetch(
        `/movies/${movie.id}/rate`,
        { method: 'POST', body: JSON.stringify({ reaction }) },
        getToken()
      )
      setUser(data.user)
      setProfile(data.user)
      const freshMatches = await apiFetch('/matches', {}, getToken())
      setMatches(freshMatches.matches || [])
      setMovies((current) => current.filter((item) => item.id !== movie.id))
      setLoadError('')
    } catch (err) {
      setLoadError(err.message || 'Could not save rating')
    }
  }

  const topMatch = useMemo(() => [...matches].sort((a, b) => b.score - a.score)[0], [matches])

  async function openChat(person) {
    try {
      const data = await apiFetch(`/messages/${person.id}`, {}, getToken())
      setChatPeer(person)
      setChatMessages(data.messages || [])
      setChatText('')
      setChatError('')
      setChatNotice(
        data.introPending
          ? 'Send one hello. Chat opens after you both message once.'
          : data.waitingOnPeer
            ? 'Your hello is in. Wait for their reply.'
            : ''
      )
      await apiFetch(`/messages/${person.id}/read`, { method: 'POST' }, getToken())
    } catch (err) {
      setLoadError(err.message || 'Could not open chat')
    }
  }

  async function sendChatMessage(e) {
    e.preventDefault()
    if (!chatPeer || !chatText.trim()) return

    try {
      const data = await apiFetch(
        '/messages',
        { method: 'POST', body: JSON.stringify({ toUserId: chatPeer.id, text: chatText }) },
        getToken()
      )
      setChatMessages((current) => [...current, data.message])
      setChatText('')
      setChatError('')
      const fresh = await apiFetch(`/messages/${chatPeer.id}`, {}, getToken())
      setChatNotice(
        fresh.introPending
          ? 'Send one hello. Chat opens after you both message once.'
          : fresh.waitingOnPeer
            ? 'Your hello is in. Wait for their reply.'
            : ''
      )
    } catch (err) {
      setChatError(err.message || 'Could not send message')
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const contentType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : ''
    if (!contentType) {
      setLoadError('Use a JPEG, PNG, or WebP photo.')
      return
    }
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    const imageBase64 = btoa(binary)
    try {
      const data = await apiFetch('/users/avatar', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, contentType })
      })
      setUser(data.user)
      setProfile(data.user)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message || 'Could not upload photo')
    }
  }

  async function undoSwipe() {
    try {
      await apiFetch('/dating/undo', { method: 'POST' })
      await loadDeck()
      setDeckMessage('Last swipe undone.')
    } catch (err) {
      setDeckMessage(err.message || 'Could not undo')
    }
  }

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

      const data = await apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(payload) }, getToken())
      setUser(data.user)
      setProfile(data.user)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message || 'Could not save profile')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <BrandMark />

        <nav className="nav">
          {['discover', 'dating', 'matches', 'messages', 'profile'].map((name) => (
            <button key={name} className={tab === name ? 'nav-pill active' : 'nav-pill'} onClick={() => setTab(name)}>
              {name}
            </button>
          ))}
        </nav>

        <button
          className="primary-button small"
          onClick={async () => {
            const refreshToken = getRefreshToken()
            if (refreshToken) {
              await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => null)
            }
            clearToken()
            window.location.reload()
          }}
        >
          Log out
        </button>
      </header>

      <main className="page-grid">
        {loadError && <p className="error-text">{loadError}</p>}
        {platform && (
          <section className="card-panel">
            <p className="eyebrow accent">Launch gate</p>
            <h3>{platform.datingLaunched ? 'Dating is live' : 'Dating unlocks at balanced registration'}</h3>
            <p className="hero-text">
              {platform.maleCount}/{platform.maleTarget} men · {platform.femaleCount}/{platform.femaleTarget} women · {platform.progressPercent}%
            </p>
            {profile && !profile.matchmaking_enabled && (
              <p className="hero-text">Add a profile photo (Profile tab) before the dating deck will include you. Daily ratings still count.</p>
            )}
          </section>
        )}
        <section className="hero card-panel">
          <div className="hero-copy">
            <p className="eyebrow accent">Curated by taste</p>
            <h2>Meet people who love your kind of cinema.</h2>
            <p className="hero-text">Rate films daily, unlock dating at launch, and message mutual matches.</p>
            <div className="stat-row">
              <div>
                <strong>{matches.length}</strong>
                <span>matches</span>
              </div>
              <div>
                <strong>{conversations.length}</strong>
                <span>conversations</span>
              </div>
              <div>
                <strong>{topMatch ? `${Math.round(topMatch.score)}%` : '0%'}</strong>
                <span>best compatibility</span>
              </div>
            </div>
          </div>

          <div className="profile-mini card-panel">
            <div className="avatar-ring">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name || 'You'} /> : null}
            </div>
            <div className="mini-meta">
              <p className="eyebrow accent">Your taste profile</p>
              <h3>
                {profile.name}, {profile.age}
              </h3>
              <p>{profile.city}</p>
            </div>
          </div>
        </section>

        {tab === 'discover' && (
          <section className="discover card-panel">
            <div className="section-head">
              <p className="eyebrow accent">Daily picks</p>
              <h3>Rate a few films to sharpen your matches</h3>
            </div>
            {!movies.length ? (
              <EmptyState emoji="🍿" title="Daily game complete" body="Come back tomorrow for a fresh set of films." />
            ) : (
              <div className="movie-grid">
                {movies.map((movie) => (
                  <article className="movie-card" key={movie.id}>
                    <div className="movie-topline">
                      <span>{movie.genres?.[0] || 'Film'}</span>
                      <span>{movie.origin_language}</span>
                    </div>
                    <h4>{movieLabel(movie)}</h4>
                    <div className="movie-actions">
                      <button className="ghost-button" onClick={() => rateMovie(movie, 'hate')}>
                        Dislike
                      </button>
                      <button className="ghost-button" onClick={() => rateMovie(movie, 'skip')}>
                        Skip
                      </button>
                      <button className="primary-button" onClick={() => rateMovie(movie, 'love')}>
                        Like
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'dating' && (
          <section className="discover card-panel">
            <div className="section-head">
              <p className="eyebrow accent">Dating deck</p>
              <h3>One profile at a time</h3>
            </div>
            {!platform?.datingLaunched ? (
              <EmptyState emoji="🚀" title="Dating is locked" body="Play the daily game while the community reaches its launch targets." />
            ) : !deck ? (
              <EmptyState emoji="🍿" title="Deck empty" body={deckMessage || 'Check back after more people finish their profiles.'} />
            ) : (
              <div className="person-card card-panel">
                <TasteProfileCard user={profile} person={deck} />
                {deckMessage && <p className="hero-text">{deckMessage}</p>}
                <div className="action-row">
                  <button className="ghost-button" type="button" onClick={() => swipe('pass')}>
                    Pass
                  </button>
                  <button className="ghost-button" type="button" onClick={undoSwipe}>
                    Undo
                  </button>
                  <button className="primary-button" type="button" onClick={() => swipe('like')}>
                    Like
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setReportTarget(deck)}>
                    Report
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'matches' && (
          <section className="matches-list">
            <div className="section-head">
              <p className="eyebrow accent">Matched by taste</p>
              <h3>People with similar movie instincts</h3>
            </div>
            {!matches.length ? (
              <EmptyState emoji="💞" title="No matches yet" body="Keep rating films and exploring profiles." />
            ) : (
              <div className="card-grid">
                {matches.map((person) => (
                  <div key={person.id} className="person-card card-panel">
                    <TasteProfileCard user={profile} person={person} />
                    <div className="action-row">
                      <button className="primary-button" onClick={() => openChat(person)}>
                        Message
                      </button>
                      <button className="ghost-button" type="button" onClick={() => setReportTarget(person)}>
                        Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'messages' && (
          <section className="discover card-panel">
            <div className="section-head">
              <p className="eyebrow accent">Messaging center</p>
              <h3>Conversations</h3>
            </div>
            {!conversations.length ? (
              <EmptyState emoji="💬" title="Inbox empty" body="Message a match to start a cinematic hello." />
            ) : (
              <div className="inbox-list">
                {conversations.map((row) => (
                  <button
                    type="button"
                    key={row.matchId}
                    className="inbox-row"
                    onClick={() => openChat({ id: row.peer.id, name: row.peer.name, avatar_url: row.peer.avatar_url, score: row.compatibility })}
                  >
                    <div>
                      <strong>{row.peer.name}</strong>
                      <p>{row.lastMessage?.text || 'Start intro chat'}</p>
                    </div>
                    <span>{Math.round(row.compatibility)}%</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'profile' && (
          <section className="profile-panel card-panel">
            <div className="section-head">
              <p className="eyebrow accent">Your movie profile</p>
              <h3>{profile.name}</h3>
            </div>

            <p className="hero-text">Profile {profile.profile_completion ?? 0}% complete. A photo unlocks dating.</p>
            <label className="ghost-button">
              {profile.photo_url ? 'Change photo' : 'Add profile photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadPhoto} />
            </label>
            <form onSubmit={handleSaveProfile} className="profile-editor">
              <div className="profile-grid">
                <div className="profile-details">
                  <input name="name" defaultValue={profile.name} />
                  <input name="city" defaultValue={profile.city} />
                  <textarea name="bio" defaultValue={profile.bio} rows="4" />
                  <input name="hobbies" defaultValue={(profile.hobbies || []).join(', ')} placeholder="Hobbies, comma-separated" />
                  <button type="submit" className="primary-button">
                    Save profile
                  </button>
                </div>
              </div>
            </form>

            <div className="taste-columns">
              <div className="taste-block">
                <h4>Liked</h4>
                <ul>
                  {(profile.loved || []).map((movie) => (
                    <li key={movie}>{movie}</li>
                  ))}
                </ul>
              </div>
              <div className="taste-block">
                <h4>Disliked</h4>
                <ul>
                  {(profile.hated || []).map((movie) => (
                    <li key={movie}>{movie}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>

      {reportTarget && (
        <ReportDialog
          person={reportTarget}
          onClose={() => setReportTarget(null)}
          onDone={(blocked) => {
            const id = reportTarget.id
            setReportTarget(null)
            setDeckMessage('Report submitted.')
            if (blocked) {
              setMatches((current) => current.filter((person) => person.id !== id))
              setConversations((current) => current.filter((row) => row.peer.id !== id))
              if (deck?.id === id) setDeck(null)
              if (chatPeer?.id === id) setChatPeer(null)
            }
          }}
        />
      )}

      {chatPeer && (
        <div className="chat-overlay">
          <div className="chat-panel card-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow accent">Chat</p>
                <h3>{chatPeer.name}</h3>
              </div>
              <button type="button" className="ghost-button" onClick={() => setChatPeer(null)}>
                Close
              </button>
            </div>
            {chatNotice && <p className="hero-text">{chatNotice}</p>}
            {chatError && <p className="error-text">{chatError}</p>}
            <div className="chat-thread">
              {chatMessages.map((message) => (
                <p key={message.id} className={message.from_user_id === profile.id ? 'chat-bubble mine' : 'chat-bubble'}>
                  {message.text}
                </p>
              ))}
            </div>
            <button type="button" className="ghost-button" onClick={() => setReportTarget(chatPeer)}>
              Report
            </button>
            <form className="chat-form" onSubmit={sendChatMessage}>
              <input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Say hello…" />
              <button type="submit" className="primary-button">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
