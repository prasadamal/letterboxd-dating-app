// The daily deck removes a film the moment it's swiped, before the server has saved the rating.
// When the parent's film list updates (after any save), films still being saved must stay out of the
// deck, or a fast second swipe can bring the first film back. Failed saves return to the front.
export type DeckFilm = { id: number | string }

export function visibleQueue<T extends DeckFilm>(movies: T[], inFlight: ReadonlySet<T['id']>): T[] {
  return movies.filter((m) => !inFlight.has(m.id))
}

export function restoreFailed<T extends DeckFilm>(queue: T[], film: T): T[] {
  return [film, ...queue.filter((m) => m.id !== film.id)]
}
