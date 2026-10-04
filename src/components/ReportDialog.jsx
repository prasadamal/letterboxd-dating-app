import { useState } from 'react'
import { apiFetch } from '../lib/api.js'

const REASONS = [
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'inappropriate', label: 'Inappropriate photo or message' },
  { value: 'fake_profile', label: 'Fake profile or underage' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' }
]

export function ReportDialog({ person, onClose, onDone }) {
  const [reason, setReason] = useState('harassment')
  const [details, setDetails] = useState('')
  const [block, setBlock] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await apiFetch('/safety/report', {
        method: 'POST',
        body: JSON.stringify({ userId: person.id, reason, details: details.trim() || undefined, block })
      })
      onDone(block)
    } catch (err) {
      setError(err.message || 'Could not send report')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-overlay">
      <form className="chat-panel card-panel" onSubmit={submit}>
        <div className="section-head">
          <div>
            <p className="eyebrow accent">Safety</p>
            <h3>Report {person.name}</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="hero-text">Reports are confidential. We review them and can remove the account.</p>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows="3" maxLength={1000} placeholder="Anything else we should know?" />
        <label className="terms-row">
          <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} />
          Also block this person
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Submit report'}
        </button>
      </form>
    </div>
  )
}
