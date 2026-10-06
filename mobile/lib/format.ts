// Compact relative times for lists: "now", "5m", "3h", "Mon", "12 Oct".
export function shortTime(iso?: string | null, now = new Date()) {
  if (!iso) return ''
  const date = new Date(iso)
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 6 * 86400) return date.toLocaleDateString(undefined, { weekday: 'short' })
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
