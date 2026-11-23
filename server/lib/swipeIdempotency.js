// A dating swipe can arrive twice (double tap, retry after a timeout). Repeating a decision that is
// already saved must be harmless: no second counter bump and no second "new match" notification.

/** 'new' (first decision about this person), 'change' (pass -> like or back), or 'repeat'. */
export function swipeKind(existingAction, action) {
  if (!existingAction) return 'new'
  return existingAction === action ? 'repeat' : 'change'
}

/** Counters move only when a decision was actually written. */
export function shouldCountSwipe(kind) {
  return kind !== 'repeat'
}

/** Notify both people only when this request is the one that created the match. */
export function shouldNotifyMatch({ matched, created }) {
  return Boolean(matched && created)
}
