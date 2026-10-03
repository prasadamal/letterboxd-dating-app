import { useEffect, useState } from 'react'

const ADMIN_KEY_STORAGE = 'reelmates_admin_key'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) || '')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

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
        <h1>Moderation queue</h1>
        <p className="hero-text">Review user reports flagged for trust & safety.</p>
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
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
