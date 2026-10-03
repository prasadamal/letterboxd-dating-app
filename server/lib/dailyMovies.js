/** Films from today's batch that the user has not rated yet today. */
export function pendingDailyMovies(movies, ratedTodayIds) {
  const rated = ratedTodayIds instanceof Set ? ratedTodayIds : new Set(ratedTodayIds || [])
  return (movies || []).filter((movie) => movie && !rated.has(movie.id))
}
