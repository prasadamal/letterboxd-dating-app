// Film prompts on the profile card (up to three). Keys are stable; the mobile app has the same list.
export const PROFILE_PROMPTS = {
  defend_forever: 'A film I will defend forever',
  overrated: 'Overrated, fight me',
  first_date: 'My perfect first-date film',
  cried: 'The last film that made me cry',
  comfort: 'My comfort rewatch',
  character: 'The character I relate to most',
  quote: 'A line I quote way too often',
  cinema: 'Best cinema experience of my life',
  guilty: 'Guilty pleasure, no shame',
  sequel: 'A film that deserves a sequel'
}

export const MAX_PROMPTS = 3
export const MAX_PROMPT_ANSWER = 120

export function normalizePrompts(list) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const out = []
  for (const item of list) {
    const key = String(item?.key || '')
    const answer = String(item?.answer || '').trim().replace(/\s+/g, ' ').slice(0, MAX_PROMPT_ANSWER)
    if (!PROFILE_PROMPTS[key] || !answer || seen.has(key)) continue
    seen.add(key)
    out.push({ key, answer })
    if (out.length === MAX_PROMPTS) break
  }
  return out
}

// Adds the question text for display.
export function publicPrompts(list) {
  return normalizePrompts(list).map((p) => ({ ...p, question: PROFILE_PROMPTS[p.key] }))
}
