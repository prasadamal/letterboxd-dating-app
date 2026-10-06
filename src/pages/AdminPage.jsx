import { useEffect, useState } from 'react'

const ADMIN_KEY_STORAGE = 'reelmates_admin_key'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) || '')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [platform, setPlatform] = useState(null)
  const [targets, setTargets] = useState({ male: '', female: '' })
  const [region, setRegion] = useState({ target: '', open: '', lookup: '', result: null })
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
    setTargets({ male: String(data.platform.maleTarget), female: String(data.platform.femaleTarget) })
    setRegion((r) => ({ ...r, target: String(data.platform.countryTarget ?? 150), open: (data.platform.openCountries || []).join(', ') }))
  }

  async function lookupCountry() {
    setError('')
    try {
      const data = await adminRequest(`/platform/country?name=${encodeURIComponent(region.lookup)}`)
      setRegion((r) => ({ ...r, result: data.country }))
    } catch (err) {
      setError(err.message)
    }
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
          <h2>Launch gate</h2>
          <p className="hero-text">
            {platform.maleCount}/{platform.maleTarget} men · {platform.femaleCount}/{platform.femaleTarget} women ·{' '}
            {platform.datingLaunched ? `Dating open since ${new Date(platform.datingLaunchedAt).toLocaleString()}` : 'Dating closed'}
          </p>
          <div className="action-row">
            <input
              value={targets.male}
              onChange={(e) => setTargets({ ...targets, male: e.target.value })}
              placeholder="Men target"
              inputMode="numeric"
            />
            <input
              value={targets.female}
              onChange={(e) => setTargets({ ...targets, female: e.target.value })}
              placeholder="Women target"
              inputMode="numeric"
            />
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                updatePlatform({ maleTarget: Number(targets.male), femaleTarget: Number(targets.female) }, 'Targets saved.')
              }
            >
              Save targets
            </button>
            {platform.datingLaunched ? (
              <button className="ghost-button" type="button" onClick={() => updatePlatform({ datingOpen: false }, 'Dating closed.')}>
                Close dating
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={() => updatePlatform({ datingOpen: true }, 'Dating opened.')}>
                Open dating now
              </button>
            )}
          </div>

          <h2>Regional launch</h2>
          <p className="hero-text">
            A country opens by itself when it has this many men and women. Countries listed below are open now regardless.
            Before the global launch, people only meet others in their own country.
          </p>
          <div className="action-row">
            <input
              value={region.target}
              onChange={(e) => setRegion({ ...region, target: e.target.value })}
              placeholder="Per-country target"
              inputMode="numeric"
            />
            <input
              value={region.open}
              onChange={(e) => setRegion({ ...region, open: e.target.value })}
              placeholder="Open countries, comma separated"
            />
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                updatePlatform(
                  {
                    countryTarget: Number(region.target),
                    openCountries: region.open.split(',').map((c) => c.trim()).filter(Boolean)
                  },
                  'Regional launch saved.'
                )
              }
            >
              Save regions
            </button>
          </div>
          <div className="action-row">
            <input value={region.lookup} onChange={(e) => setRegion({ ...region, lookup: e.target.value })} placeholder="Check a country" />
            <button className="ghost-button" type="button" onClick={lookupCountry} disabled={!region.lookup.trim()}>
              Check
            </button>
            {region.result && (
              <span className="hero-text">
                {region.result.name}: {region.result.maleCount}/{region.result.target} men · {region.result.femaleCount}/
                {region.result.target} women · {region.result.open ? 'open' : 'closed'}
              </span>
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
