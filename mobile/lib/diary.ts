import { apiFetch } from './api'
import type { DiaryEntry } from './diaryFormat'

export type { DiaryEntry } from './diaryFormat'
export type DiaryDraft = { watchedOn: string; stars: number | null; note: string; rewatch: boolean }

// The last list loaded, tagged with whose it is, so the edit screen can open an entry instantly and a
// list from a previous account is never shown to the next one.
let cache: { owner: string; entries: DiaryEntry[] } | null = null

export function cachedEntry(owner: string | undefined, id: string): DiaryEntry | null {
  if (!owner || cache?.owner !== owner) return null
  return cache.entries.find((e) => e.id === id) ?? null
}

export async function loadDiary(owner: string): Promise<DiaryEntry[]> {
  const { entries } = await apiFetch<{ entries: DiaryEntry[] }>('/movies/diary')
  cache = { owner, entries }
  return entries
}

export async function logFilm(owner: string, filmId: number, draft: DiaryDraft): Promise<DiaryEntry> {
  const { entry } = await apiFetch<{ entry: DiaryEntry }>(`/movies/${filmId}/diary`, { method: 'POST', body: JSON.stringify(draft) })
  if (cache?.owner === owner) cache = { owner, entries: [entry, ...cache.entries] }
  return entry
}

export async function editEntry(owner: string, id: string, draft: DiaryDraft): Promise<DiaryEntry> {
  const { entry } = await apiFetch<{ entry: DiaryEntry }>(`/movies/diary/${id}`, { method: 'PATCH', body: JSON.stringify(draft) })
  if (cache?.owner === owner) cache = { owner, entries: cache.entries.map((e) => (e.id === id ? entry : e)) }
  return entry
}

export async function deleteEntry(owner: string, id: string): Promise<void> {
  await apiFetch(`/movies/diary/${id}`, { method: 'DELETE' })
  if (cache?.owner === owner) cache = { owner, entries: cache.entries.filter((e) => e.id !== id) }
}
