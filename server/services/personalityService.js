import { supabase } from '../supabaseClient.js'
import { selectAllIn } from '../lib/paging.js'
import { filmPersonality, personalityBadge } from '../lib/filmPersonality.js'

// Film personalities for a handful of people (the cards actually shown), from their likes and dislikes.
export async function getPersonalities(userIds) {
  const rows = await selectAllIn(userIds, (ids) =>
    supabase
      .from('user_ratings')
      .select('user_id, rating, movies(genres, origin_language, year, popularity, tags)')
      .in('user_id', ids)
      .in('rating', ['love', 'hate'])
      .order('user_id')
      .order('movie_id')
  )
  const byUser = new Map()
  for (const row of rows) {
    if (!row.movies) continue
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, [])
    byUser.get(row.user_id).push({ rating: row.rating, ...row.movies })
  }
  return new Map([...new Set(userIds)].map((id) => [id, filmPersonality(byUser.get(id) || [])]))
}

// Adds a compact `personality` badge (or null while someone is still a Fresh Reel) to each person.
export async function withPersonalities(people) {
  if (!people.length) return people
  const map = await getPersonalities(people.map((p) => p.id))
  return people.map((p) => ({ ...p, personality: personalityBadge(map.get(p.id)) }))
}
