import { useSyncExternalStore } from 'react'
import { apiFetch } from './api'
import { initialWatch, replaceIds, settleToggle, startToggle, type WatchState } from './watchlistState'

export type WatchFilm = { id: number; title: string; year: number; genres: string[]; origin_language?: string; addedAt: string }

let state: WatchState = initialWatch(null)
const listeners = new Set<() => void>()

function emit(next: WatchState) {
  if (next === state) return
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Saved film ids for the signed-in member; re-renders when they change. */
export function useWatchlist(): WatchState {
  return useSyncExternalStore(subscribe, () => state)
}

/** Called when the signed-in account changes: a different member never sees the last one's list. */
export function setWatchOwner(owner: string | null) {
  if (state.owner !== owner) emit(initialWatch(owner))
}

/** For code outside React: is this film on the signed-in member's list right now? */
export function isSaved(id: number): boolean {
  return state.ids.has(id)
}

export async function refreshWatchlist(): Promise<WatchFilm[]> {
  const owner = state.owner
  if (!owner) return []
  const data = await apiFetch<{ films: WatchFilm[] }>('/movies/watchlist')
  emit(replaceIds(state, owner, data.films.map((film) => film.id)))
  return owner === state.owner ? data.films : []
}

/** Save or remove one film. Shows the change at once and undoes it if the server says no. */
export async function toggleWatchlist(id: number): Promise<void> {
  const owner = state.owner
  const started = startToggle(state, id)
  if (!started) return
  emit(started.next)
  try {
    await apiFetch(`/movies/${id}/watchlist`, { method: started.saving ? 'PUT' : 'DELETE' })
    emit(settleToggle(state, owner, id, started.saving, true))
  } catch (error) {
    emit(settleToggle(state, owner, id, started.saving, false))
    throw error
  }
}
