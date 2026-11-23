// Chats must never mistake a failed request for "no matches". The empty state is shown only after
// the server actually answered with an empty inbox; on failure the last good inbox stays on screen.
export type InboxView<T> = { items: T[] | null; failed: boolean }

export function nextInbox<T>(prev: InboxView<T>, result: { ok: true; items: T[] } | { ok: false }): InboxView<T> {
  if (result.ok) return { items: result.items, failed: false }
  return { items: prev.items, failed: true }
}

/** True only when the server confirmed there is nothing: no chats, no likes, and no failed request. */
export function showEmptyInbox(view: InboxView<unknown>, likesCount: number, likesFailed: boolean) {
  return !view.failed && !likesFailed && view.items !== null && view.items.length === 0 && !likesCount
}
