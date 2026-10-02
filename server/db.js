import { supabase } from './supabaseClient.js'
import { movieCatalog } from './movieCatalog.js'

function formatMovieLabel(movie) {
  return `${movie.title} (${movie.year})`
}

function hashSeed(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededShuffle(items, seedKey) {
  const copy = [...items]
  let seed = hashSeed(seedKey)
  for (let i = copy.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0
    const j = seed % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickDailySet(pool, userId, day, count = 8) {
  const famous = pool.filter((movie) => movie.popularity >= 55)
  const underrated = pool.filter((movie) => movie.popularity < 55)
  const genres = new Set()
  const languages = new Set()
  const picks = []

  function tryAdd(movie) {
    if (!movie || picks.some((item) => item.id === movie.id)) return false
    picks.push(movie)
    genres.add(movie.genres?.[0] || 'Drama')
    languages.add(movie.origin_language || 'English')
    return true
  }

  const famousOrder = seededShuffle(famous, `${userId}:${day}:famous`)
  const hiddenOrder = seededShuffle(underrated, `${userId}:${day}:hidden`)
  const targetFamous = Math.ceil(count / 2)

  for (const movie of famousOrder) {
    if (picks.filter((item) => item.popularity >= 55).length >= targetFamous) break
    tryAdd(movie)
  }

  for (const movie of hiddenOrder) {
    if (picks.length >= count) break
    tryAdd(movie)
  }

  const remainder = seededShuffle(
    pool.filter((movie) => !picks.some((item) => item.id === movie.id)),
    `${userId}:${day}:fill`
  )

  for (const movie of remainder) {
    if (picks.length >= count) break
    tryAdd(movie)
  }

  return picks.slice(0, count)
}

async function getRatingsForUsers(userIds) {
  if (!userIds.length) return new Map()

  const { data, error } = await supabase
    .from('user_ratings')
    .select('user_id, rating, movie_id, movies(title, year)')
    .in('user_id', userIds)

  if (error) throw error

  const byUser = new Map()
  for (const row of data || []) {
    if (!byUser.has(row.user_id)) {
      byUser.set(row.user_id, { love: new Set(), hate: new Set(), labels: { love: [], hate: [] } })
    }
    const bucket = byUser.get(row.user_id)
    const label = row.movies ? formatMovieLabel(row.movies) : String(row.movie_id)
    if (row.rating === 'love') {
      bucket.love.add(row.movie_id)
      bucket.labels.love.push(label)
    }
    if (row.rating === 'hate') {
      bucket.hate.add(row.movie_id)
      bucket.labels.hate.push(label)
    }
  }

  return byUser
}

export function mapUserRow(row, taste = { loved: [], hated: [] }) {
  return {
    id: row.id,
    email: row.email,
    name: row.display_name,
    age: row.age ?? 25,
    city: row.city ?? '',
    bio: row.bio ?? '',
    hobbies: row.hobbies ?? [],
    avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(row.display_name || row.email)}`,
    loved: taste.loved,
    hated: taste.hated
  }
}

export function ensureUserProfile(user) {
  const { password_hash: _passwordHash, password: _password, ...safe } = user
  return {
    ...safe,
    loved: user.loved || [],
    hated: user.hated || []
  }
}

export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', String(email).trim())
    .maybeSingle()

  if (error) throw error
  return data
}

export async function findUserById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getUserProfile(userId) {
  const user = await findUserById(userId)
  if (!user) return null

  const ratings = await getRatingsForUsers([userId])
  const taste = ratings.get(userId)?.labels || { love: [], hate: [] }
  return mapUserRow(user, { loved: taste.love, hated: taste.hate })
}

export async function createUser(payload) {
  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getMovieById(id) {
  const { data, error } = await supabase.from('movies').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data
}

export async function getDailyMovies(userId) {
  const day = new Date().toISOString().slice(0, 10)

  const { data: batch, error: batchError } = await supabase
    .from('daily_batches')
    .select('movie_ids')
    .eq('user_id', userId)
    .eq('day', day)
    .eq('seq', 0)
    .maybeSingle()

  if (batchError) throw batchError

  if (batch?.movie_ids?.length) {
    const { data: movies, error } = await supabase.from('movies').select('*').in('id', batch.movie_ids)
    if (error) throw error
    const order = new Map(batch.movie_ids.map((id, index) => [id, index]))
    return (movies || []).sort((a, b) => order.get(a.id) - order.get(b.id))
  }

  const { data: ratedRows, error: ratedError } = await supabase
    .from('user_ratings')
    .select('movie_id')
    .eq('user_id', userId)

  if (ratedError) throw ratedError

  const ratedIds = new Set((ratedRows || []).map((row) => row.movie_id))

  const { data: pool, error: poolError } = await supabase
    .from('movies')
    .select('*')
    .eq('in_deck', true)

  if (poolError) throw poolError

  const available = (pool || []).filter((movie) => !ratedIds.has(movie.id))
  const picks = pickDailySet(available, userId, day, 8)

  if (picks.length) {
    const { error: insertError } = await supabase.from('daily_batches').insert({
      user_id: userId,
      day,
      seq: 0,
      movie_ids: picks.map((movie) => movie.id)
    })
    if (insertError) throw insertError
  }

  return picks
}

export async function rateMovie(userId, movieId, reaction) {
  if (reaction === 'skip') {
    await supabase.from('user_ratings').upsert(
      {
        user_id: userId,
        movie_id: movieId,
        rating: 'skip',
        rated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,movie_id' }
    )
    return getUserProfile(userId)
  }

  const { error } = await supabase.from('user_ratings').upsert(
    {
      user_id: userId,
      movie_id: movieId,
      rating: reaction,
      rated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,movie_id' }
  )

  if (error) throw error
  return getUserProfile(userId)
}

export function computeCompatibilityFromMaps(userMap, candidateMap) {
  if (!userMap || !candidateMap) return { score: 50, summary: 'Still discovering taste overlap.' }

  let sharedLove = 0
  let sharedHate = 0
  let conflicts = 0

  for (const movieId of userMap.love) {
    if (candidateMap.love.has(movieId)) sharedLove += 1
    if (candidateMap.hate.has(movieId)) conflicts += 1
  }

  for (const movieId of userMap.hate) {
    if (candidateMap.hate.has(movieId)) sharedHate += 1
    if (candidateMap.love.has(movieId)) conflicts += 1
  }

  const score = Math.max(0, Math.min(99, 45 + sharedLove * 14 + sharedHate * 9 - conflicts * 16))
  const summary = buildTasteSummary(userMap.labels, candidateMap.labels)

  return { score, summary, sharedLove, sharedHate, conflicts }
}

export function buildTasteSummary(userLabels, candidateLabels) {
  const sharedLoved = (candidateLabels?.love || [])
    .filter((title) => (userLabels?.love || []).includes(title))
    .slice(0, 2)
  const sharedHated = (candidateLabels?.hate || [])
    .filter((title) => (userLabels?.hate || []).includes(title))
    .slice(0, 2)

  const parts = []
  if (sharedLoved.length) parts.push(`Loved: ${sharedLoved.join(' · ')}`)
  if (sharedHated.length) parts.push(`Disliked: ${sharedHated.join(' · ')}`)

  return parts.join(' · ') || 'Different taste, but worth a conversation.'
}

export async function getMatchesForUser(userId) {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, display_name, bio, hobbies, city, age')
    .neq('id', userId)

  if (error) throw error

  const ids = [userId, ...(users || []).map((user) => user.id)]
  const ratings = await getRatingsForUsers(ids)
  const selfMap = ratings.get(userId)

  return (users || [])
    .map((candidate) => {
      const stats = computeCompatibilityFromMaps(selfMap, ratings.get(candidate.id))
      const taste = ratings.get(candidate.id)?.labels || { love: [], hate: [] }
      return {
        ...mapUserRow(candidate, { loved: taste.love, hated: taste.hate }),
        score: stats.score,
        tasteSummary: stats.summary
      }
    })
    .sort((a, b) => b.score - a.score)
}

async function orderedMatchUsers(a, b) {
  return a < b ? [a, b] : [b, a]
}

export async function getOrCreateMatch(userId, peerId) {
  const [userA, userB] = await orderedMatchUsers(userId, peerId)
  const { data: existing, error: findError } = await supabase
    .from('matches')
    .select('*')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing

  const ratings = await getRatingsForUsers([userId, peerId])
  const stats = computeCompatibilityFromMaps(ratings.get(userId), ratings.get(peerId))

  const { data, error } = await supabase
    .from('matches')
    .insert({
      user_a: userA,
      user_b: userB,
      compatibility: stats.score,
      shared_loves: stats.sharedLove || 0,
      shared_hates: stats.sharedHate || 0,
      conflicts: stats.conflicts || 0
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function getOrCreateConversation(matchId) {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing

  const { data, error } = await supabase.from('conversations').insert({ match_id: matchId }).select('*').single()
  if (error) throw error
  return data
}

export async function getMessagesBetween(userId, peerId) {
  const match = await getOrCreateMatch(userId, peerId)
  const conversation = await getOrCreateConversation(match.id)

  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data || []).map((row) => ({
    id: row.id,
    from_user_id: row.sender_id,
    to_user_id: row.sender_id === userId ? peerId : userId,
    text: row.body,
    created_at: row.created_at
  }))
}

export async function sendMessage(userId, peerId, text) {
  const match = await getOrCreateMatch(userId, peerId)
  const conversation = await getOrCreateConversation(match.id)

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: userId,
      body: text
    })
    .select('id, sender_id, body, created_at')
    .single()

  if (error) throw error

  return {
    id: data.id,
    from_user_id: data.sender_id,
    to_user_id: peerId,
    text: data.body,
    created_at: data.created_at
  }
}

export async function seedMoviesIfEmpty() {
  const { count, error: countError } = await supabase.from('movies').select('*', { count: 'exact', head: true })
  if (countError) throw countError
  if (count && count > 0) return { seeded: 0, total: count }

  const rows = movieCatalog.map((movie) => ({
    id: movie.id,
    title: movie.title,
    year: movie.year,
    genres: movie.genres,
    popularity: movie.popularity,
    in_deck: movie.in_deck,
    origin_language: movie.origin_language,
    franchise: null
  }))

  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('movies').upsert(chunk, { onConflict: 'id' })
    if (error) throw error
  }

  return { seeded: rows.length, total: rows.length }
}

export { movieCatalog }
