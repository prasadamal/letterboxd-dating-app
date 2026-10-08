import { useEffect, useState } from 'react'

const ADMIN_KEY_STORAGE = 'reelmates_admin_key'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) || '')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [platform, setPlatform] = useState(null)
  const [launch, setLaunch] = useState({ target: '', open: '' })
  const [plusGrant, setPlusGrant] = useState({ userId: '', days: '30' })
  const [feedback, setFeedback] = useState([])
  const [feedbackStatus, setFeedbackStatus] = useState('new')

  async function adminRequest(path, options = {}, key = adminKey) {
    const res = await fetch(`/api/v1/admin${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key, ...(options.headers || {}) }
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Request failed')
    return data
  }

  async function loadPlatform(key = adminKey) {
    const data = await adminRequest('/platform', {}, key)
    setPlatform(data.platform)
    setLaunch({ target: String(data.platform.cityTarget ?? 150), open: (data.platform.openCities || []).join('; ') })
  }

  async function grantPlus(days) {
    setError('')
    setNotice('')
    try {
      await adminRequest(`/users/${plusGrant.userId.trim()}/plus`, { method: 'PATCH', body: JSON.stringify({ days }) })
      setNotice(days ? `Plus given for ${days} days.` : 'Plus removed.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadFeedback(key = adminKey, status = feedbackStatus) {
    const data = await adminRequest(`/feedback?status=${status}`, {}, key)
    setFeedback(data.items || [])
  }

  async function markFeedback(id, status) {
    setError('')
    try {
      await adminRequest(`/feedback/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await loadFeedback()
    } catch (err) {
      setError(err.message)
    }
  }

  async function switchFeedback(status) {
    setFeedbackStatus(status)
    setError('')
    try {
      await loadFeedback(adminKey, status)
    } catch (err) {
      setError(err.message)
    }
  }

  async function updatePlatform(body, message) {
    setError('')
    setNotice('')
    try {
      const data = await adminRequest('/platform', { method: 'PATCH', body: JSON.stringify(body) })
      setPlatform(data.platform)
      setNotice(message)
    } catch (err) {
      setError(err.message)
    }
  }

  async function suspend(userId) {
    if (!userId || !window.confirm('Suspend this account? They are signed out and hidden from everyone.')) return
    setError('')
    try {
      await adminRequest(`/users/${userId}/suspension`, {
        method: 'PATCH',
        body: JSON.stringify({ suspended: true, reason: 'Suspended from moderation queue' })
      })
      setNotice('Account suspended.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadQueue(key = adminKey) {
    if (!key) return
    setError('')
    try {
      const res = await fetch('/api/v1/admin/moderation/queue?status=open', {
        headers: { 'x-admin-key': key }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load queue')
      setItems(data.items || [])
      localStorage.setItem(ADMIN_KEY_STORAGE, key)
      await loadPlatform(key)
      await loadFeedback(key)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (adminKey) loadQueue(adminKey)
  }, [])

  async function resolve(id, status) {
    try {
      const res = await fetch(`/api/v1/admin/moderation/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Update failed')
      await loadQueue()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-head">
        <h1>ReelMates admin</h1>
        <p className="hero-text">Launch gate and trust &amp; safety. Review open reports at least once a day.</p>
      </header>

      <div className="admin-key-row card-panel">
        <input
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="Admin API key (x-admin-key)"
          type="password"
        />
        <button className="primary-button" type="button" onClick={() => loadQueue()}>
          Load queue
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {notice && <p className="hero-text">{notice}</p>}

      {platform && (
        <section className="admin-table card-panel">
          <h2>City launch</h2>
          <p className="hero-text">
            A city opens by itself when it has this many women and this many men who want to date. Cities listed below open now
            regardless (use “Kochi” or “Kochi, India”). People meet others in their own city, or in every open city of their
            country if both chose that.
          </p>
          <div className="action-row">
            <input
              value={launch.target}
              onChange={(e) => setLaunch({ ...launch, target: e.target.value })}
              placeholder="Women and men per city"
              inputMode="numeric"
            />
            <input
              value={launch.open}
              onChange={(e) => setLaunch({ ...launch, open: e.target.value })}
              placeholder="Cities to open now, separated by ;"
            />
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                updatePlatform(
                  {
                    cityTarget: Number(launch.target),
                    openCities: launch.open.split(';').map((c) => c.trim()).filter(Boolean)
                  },
                  'City launch saved.'
                )
              }
            >
              Save
            </button>
          </div>
          {platform.cities?.length ? (
            <table className="city-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Women</th>
                  <th>Men</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {platform.cities.slice(0, 50).map((city) => (
                  <tr key={city.key}>
                    <td>
                      {city.name}, {city.country}
                    </td>
                    <td>
                      {city.femaleCount}/{city.target}
                    </td>
                    <td>
                      {city.maleCount}/{city.target}
                    </td>
                    <td>{city.progressPercent}%</td>
                    <td>{city.open ? (city.openedByAdmin ? 'Open (by hand)' : 'Open') : 'Closed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="hero-text">No members with a city yet.</p>
          )}

          <h2>Open everywhere</h2>
          <p className="hero-text">
            {platform.openEverywhere
              ? `Dating is open everywhere since ${new Date(platform.openedEverywhereAt).toLocaleString()}. Use this for app-store review, then close it.`
              : 'Opens dating for every member at once, whatever their city. For app-store review and testing.'}
          </p>
          <div className="action-row">
            {platform.openEverywhere ? (
              <button className="ghost-button" type="button" onClick={() => updatePlatform({ datingOpen: false }, 'Closed everywhere.')}>
                Close everywhere
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={() => updatePlatform({ datingOpen: true }, 'Opened everywhere.')}>
                Open everywhere
              </button>
            )}
          </div>

          <h2>ReelMates Plus</h2>
          <div className="action-row">
            <input value={plusGrant.userId} onChange={(e) => setPlusGrant({ ...plusGrant, userId: e.target.value })} placeholder="User id" />
            <input
              value={plusGrant.days}
              onChange={(e) => setPlusGrant({ ...plusGrant, days: e.target.value })}
              placeholder="Days"
              inputMode="numeric"
            />
            <button className="ghost-button" type="button" disabled={!plusGrant.userId.trim()} onClick={() => grantPlus(Number(plusGrant.days))}>
              Give Plus
            </button>
            <button className="ghost-button" type="button" disabled={!plusGrant.userId.trim()} onClick={() => grantPlus(null)}>
              Remove Plus
            </button>
          </div>
        </section>
      )}

      <div className="admin-table card-panel">
        {!items.length ? (
          <p className="hero-text">No open moderation items.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="admin-row">
              <div>
                <strong>#{item.id}</strong>
                <p>{item.report?.reason || 'report'} — {item.report?.details?.slice(0, 120)}</p>
                <p className="hero-text">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="action-row">
                <button className="ghost-button" type="button" onClick={() => resolve(item.id, 'reviewing')}>
                  Review
                </button>
                <button className="primary-button" type="button" onClick={() => resolve(item.id, 'resolved')}>
                  Resolve
                </button>
                <button className="ghost-button" type="button" onClick={() => resolve(item.id, 'dismissed')}>
                  Dismiss
                </button>
                <button className="ghost-button" type="button" onClick={() => suspend(item.report?.reported_id)}>
                  Suspend reported user
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="admin-table card-panel">
        <h2>Feedback inbox</h2>
        <div className="action-row">
          {['new', 'read', 'done'].map((status) => (
            <button
              key={status}
              className={status === feedbackStatus ? 'primary-button' : 'ghost-button'}
              type="button"
              onClick={() => switchFeedback(status)}
            >
              {status === 'new' ? 'New' : status === 'read' ? 'Read' : 'Done'}
            </button>
          ))}
        </div>
        {!feedback.length ? (
          <p className="hero-text">No {feedbackStatus} feedback.</p>
        ) : (
          feedback.map((item) => (
            <article key={item.id} className="admin-row">
              <div>
                <strong>
                  #{item.id} · {item.category}
                </strong>
                <p style={{ whiteSpace: 'pre-wrap' }}>{item.message}</p>
                <p className="hero-text">
                  {new Date(item.created_at).toLocaleString()}
                  {item.platform ? ` · ${item.platform}` : ''}
                  {item.app_version ? ` · v${item.app_version}` : ''}
                </p>
              </div>
              <div className="action-row">
                {item.status !== 'read' && (
                  <button className="ghost-button" type="button" onClick={() => markFeedback(item.id, 'read')}>
                    Mark read
                  </button>
                )}
                {item.status !== 'done' && (
                  <button className="primary-button" type="button" onClick={() => markFeedback(item.id, 'done')}>
                    Done
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
