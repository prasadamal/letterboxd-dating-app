import { movieCatalog } from './movieCatalog.js'
import { hashPasswordSync, publicUser } from './lib/security.js'

// Demo accounts share this password (documented in the README). Disable them with SEED_DEMO_USERS=false.
const DEMO_PASSWORD = '123456'

// movieCatalog.js contains a few repeated titles under different ids; keep the first of each.
const seenTitles = new Set()
const movies = movieCatalog.filter((movie) => {
  if (seenTitles.has(movie.title)) return false
  seenTitles.add(movie.title)
  return true
})

function seedUsers() {
  if (process.env.SEED_DEMO_USERS === 'false') return []
  return [
    {
      id: 1,
      email: 'maya@example.com',
      password_hash: hashPasswordSync(DEMO_PASSWORD),
      name: 'Maya',
      age: 27,
      city: 'Brooklyn',
      bio: 'I love thoughtful cinema and slow-burn romances.',
      hobbies: ['Cinema', 'Hiking', 'Travel'],
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      loved: ['Shawshank Redemption', 'The Godfather', 'Spirited Away', 'Moonlight'],
      hated: ['Marvel Cinematic Universe', 'Generic action remakes']
    },
    {
      id: 2,
      email: 'anna@example.com',
      password_hash: hashPasswordSync(DEMO_PASSWORD),
      name: 'Anna',
      age: 29,
      city: 'Austin',
      bio: 'I collect great performances and dream about midnight screenings.',
      hobbies: ['Film clubs', 'Cooking', 'Road trips'],
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
      loved: ['Shawshank Redemption', 'The Godfather', 'The Apartment', 'Moonlight'],
      hated: ['Marvel Cinematic Universe', 'Superhero fatigue']
    },
    {
      id: 3,
      email: 'luca@example.com',
      password_hash: hashPasswordSync(DEMO_PASSWORD),
      name: 'Luca',
      age: 31,
      city: 'Chicago',
      bio: 'Classic films, deep conversations, and film history nerding.',
      hobbies: ['Photography', 'Chess', 'Jazz'],
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      loved: ['The Social Network', 'Spirited Away', 'Arrival', 'The Grand Budapest Hotel'],
      hated: ['Low-budget action', 'Generic streaming thrillers']
    }
  ]
}

function createStore() {
  const users = seedUsers()
  return {
    users,
    movies,
    ratings: [], // { user_id, movie_id, reaction, created_at } - love | hate | skip
    likes: [], // { from_user_id, to_user_id, created_at }
    passes: [], // { from_user_id, to_user_id, created_at }
    messages: [], // { id, from_user_id, to_user_id, body, created_at }
    nextUserId: users.reduce((max, user) => Math.max(max, user.id), 0) + 1,
    nextMessageId: 1
  }
}

export const store = createStore()

// Let the seeded demo users start with an admirer so "like -> match -> chat" can be tried with one login.
function seedDemoLikes() {
  const maya = store.users.find((user) => user.email === 'maya@example.com')
  if (!maya) return
  for (const user of store.users) {
    if (user.id !== maya.id) store.likes.push({ from_user_id: user.id, to_user_id: maya.id, created_at: new Date() })
  }
}
seedDemoLikes()

/** Reset the in-memory store to its seeded state (used by tests). */
export function resetStore() {
  Object.assign(store, createStore())
  seedDemoLikes()
}

export { publicUser }

export function addUser(user) {
  const created = { ...user, id: store.nextUserId++ }
  store.users.push(created)
  return created
}

export function findUserByEmail(email) {
  const needle = String(email || '').trim().toLowerCase()
  return store.users.find((user) => user.email.toLowerCase() === needle)
}

export function findUserById(id) {
  return store.users.find((user) => user.id === Number(id))
}

export function getMovieById(id) {
  return store.movies.find((movie) => movie.id === Number(id))
}

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Movies the user has already loved, hated or skipped. */
export function getRatedMovieIds(userId) {
  const user = findUserById(userId)
  const ids = new Set(store.ratings.filter((rating) => rating.user_id === userId).map((rating) => rating.movie_id))
  if (user) {
    const titles = new Set([...(user.loved || []), ...(user.hated || [])])
    for (const movie of store.movies) if (titles.has(movie.title)) ids.add(movie.id)
  }
  return ids
}

export function getDailyMovies(userId, count = 5) {
  const rated = getRatedMovieIds(userId)
  return shuffle(store.movies.filter((movie) => !rated.has(movie.id))).slice(0, count)
}

export function rateMovie(userId, movieId, reaction) {
  const user = findUserById(userId)
  const movie = getMovieById(movieId)
  if (!user || !movie) return null

  user.loved = user.loved || []
  user.hated = user.hated || []

  if (reaction === 'love') {
    user.loved = [...new Set([...user.loved, movie.title])]
    user.hated = user.hated.filter((title) => title !== movie.title)
  } else if (reaction === 'hate') {
    user.hated = [...new Set([...user.hated, movie.title])]
    user.loved = user.loved.filter((title) => title !== movie.title)
  }
  // 'skip' leaves the taste profile untouched; it is only recorded so the movie is not shown again.

  store.ratings = store.ratings.filter((rating) => !(rating.user_id === userId && rating.movie_id === movie.id))
  store.ratings.push({ user_id: userId, movie_id: movie.id, reaction, created_at: new Date() })

  return user
}

export function computeCompatibility(user, candidate) {
  const sharedLoved = (user.loved || []).filter((movie) => (candidate.loved || []).includes(movie)).length
  const sharedHated = (user.hated || []).filter((movie) => (candidate.hated || []).includes(movie)).length

  return Math.min(99, 55 + sharedLoved * 12 + sharedHated * 8)
}

export function buildTasteSummary(user, candidate) {
  const sharedLoved = (candidate.loved || []).filter((movie) => (user.loved || []).includes(movie)).slice(0, 2)
  const sharedHated = (candidate.hated || []).filter((movie) => (user.hated || []).includes(movie)).slice(0, 2)

  const parts = []
  if (sharedLoved.length) parts.push(`Loved: ${sharedLoved.join(' and ')} like you`)
  if (sharedHated.length) parts.push(`Hated: ${sharedHated.join(' and ')} like you`)

  return parts.join(' · ') || 'Different taste, but definitely interesting.'
}

export function hasLiked(fromId, toId) {
  return store.likes.some((like) => like.from_user_id === fromId && like.to_user_id === toId)
}

export function isMutualMatch(a, b) {
  return hasLiked(a, b) && hasLiked(b, a)
}

export function hasPassed(fromId, toId) {
  return store.passes.some((pass) => pass.from_user_id === fromId && pass.to_user_id === toId)
}

/** Public view of `candidate` as seen by `user`: no secrets, with score + relationship flags. */
export function presentMatch(user, candidate) {
  const { email, ...profile } = publicUser(candidate) // other users' emails are private
  return {
    ...profile,
    score: computeCompatibility(user, candidate),
    tasteSummary: buildTasteSummary(user, candidate),
    liked: hasLiked(user.id, candidate.id),
    matched: isMutualMatch(user.id, candidate.id)
  }
}

export function getMatchesForUser(userId) {
  const user = findUserById(userId)
  if (!user) return []

  return store.users
    .filter((candidate) => candidate.id !== userId && !hasPassed(userId, candidate.id))
    .map((candidate) => presentMatch(user, candidate))
    .sort((a, b) => b.score - a.score)
}

export function getConversation(userId, otherId) {
  return store.messages.filter(
    (message) =>
      (message.from_user_id === userId && message.to_user_id === otherId) ||
      (message.from_user_id === otherId && message.to_user_id === userId)
  )
}

export function addMessage(fromId, toId, body) {
  const message = { id: store.nextMessageId++, from_user_id: fromId, to_user_id: toId, body, created_at: new Date().toISOString() }
  store.messages.push(message)
  return message
}
