// First-line filter for user-written text (chat, bio, name). App Store guideline 1.2 requires apps with
// user content to filter objectionable material before it is posted; reports and moderation cover the rest.
// Extend the list per market with CONTENT_BLOCKLIST (comma-separated words or phrases).
const DEFAULT_TERMS = [
  'fuck you',
  'kill yourself',
  'kys',
  'send nudes',
  'nudes',
  'whore',
  'slut',
  'cunt',
  'rape'
]

function buildPattern() {
  const extra = (process.env.CONTENT_BLOCKLIST || '')
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
  const terms = [...new Set([...DEFAULT_TERMS, ...extra])]
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped.join('|')})(?=$|[^\\p{L}\\p{N}])`, 'iu')
}

const pattern = buildPattern()

export function containsBlockedContent(text) {
  if (!text) return false
  return pattern.test(String(text).normalize('NFKC'))
}
