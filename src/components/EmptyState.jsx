export function EmptyState({ emoji = '🎬', title, body }) {
  return (
    <div className="empty-state">
      <div className="empty-emoji" aria-hidden>
        {emoji}
      </div>
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  )
}
