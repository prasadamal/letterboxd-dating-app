// Pure watchlist state: which films are saved for the signed-in member, and which are mid-request.
// Every change names its owner, so a reply that arrives after a sign-out or account switch is ignored.

export type WatchState = {
  owner: string | null
  ids: ReadonlySet<number>
  pending: ReadonlySet<number>
}

export function initialWatch(owner: string | null): WatchState {
  return { owner, ids: new Set(), pending: new Set() }
}

/** Optimistic toggle. Null while the same film is already being saved or removed (a double tap). */
export function startToggle(state: WatchState, id: number): { next: WatchState; saving: boolean } | null {
  if (!state.owner || state.pending.has(id)) return null
  const saving = !state.ids.has(id)
  const ids = new Set(state.ids)
  if (saving) ids.add(id)
  else ids.delete(id)
  return { next: { ...state, ids, pending: new Set(state.pending).add(id) }, saving }
}

/** The server answered: keep the optimistic change, or put the film back the way it was. */
export function settleToggle(state: WatchState, owner: string | null, id: number, saving: boolean, ok: boolean): WatchState {
  if (owner !== state.owner) return state
  const pending = new Set(state.pending)
  pending.delete(id)
  const ids = new Set(state.ids)
  if (!ok) {
    if (saving) ids.delete(id)
    else ids.add(id)
  }
  return { ...state, ids, pending }
}

/** A fresh list from the server. Films with a request in flight keep their optimistic state. */
export function replaceIds(state: WatchState, owner: string | null, ids: number[]): WatchState {
  if (owner !== state.owner) return state
  const next = new Set(ids)
  for (const id of state.pending) {
    if (state.ids.has(id)) next.add(id)
    else next.delete(id)
  }
  return { ...state, ids: next }
}
