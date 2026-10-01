const movies = [
  { id: 1, title: 'Shawshank Redemption', genre: 'Drama', mood: 'Hopeful', description: 'A prison drama with remarkable emotional payoff.' },
  { id: 2, title: 'The Godfather', genre: 'Crime', mood: 'Epic', description: 'A legendary family story shaped by ambition and loyalty.' },
  { id: 3, title: 'Spirited Away', genre: 'Animation', mood: 'Magical', description: 'A dreamlike adventure through a mysterious spirit world.' },
  { id: 4, title: 'Moonlight', genre: 'Drama', mood: 'Intimate', description: 'A tender story of identity, memory, and growing up.' },
  { id: 5, title: 'Parasite', genre: 'Thriller', mood: 'Sharp', description: 'A social satire that becomes tension-filled and unforgettable.' },
  { id: 6, title: 'Arrival', genre: 'Sci-Fi', mood: 'Thoughtful', description: 'A human story shaped by language, connection, and time.' },
  { id: 7, title: 'The Social Network', genre: 'Drama', mood: 'Fast', description: 'A sharp and stylish look at ambition and innovation.' },
  { id: 8, title: 'The Grand Budapest Hotel', genre: 'Comedy', mood: 'Whimsical', description: 'Stylish, funny, and pictorially rich.' },
  { id: 9, title: 'The Apartment', genre: 'Romance', mood: 'Warm', description: 'A bittersweet romantic classic with wit and heart.' },
  { id: 10, title: 'Dune', genre: 'Sci-Fi', mood: 'Epic', description: 'Big ideas and massive scale with strong visual storytelling.' },
  { id: 11, title: 'No Country for Old Men', genre: 'Thriller', mood: 'Tense', description: 'A brutal, elegant thriller with razor sharp energy.' },
  { id: 12, title: 'Lady Bird', genre: 'Coming-of-age', mood: 'Honest', description: 'A realistic, intimate portrait of growing up.' }
]

export const store = {
  users: [
    {
      id: 1,
      email: 'maya@example.com',
      password: '123456',
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
      password: '123456',
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
      password: '123456',
      name: 'Luca',
      age: 31,
      city: 'Chicago',
      bio: 'Classic films, deep conversations, and film history nerding.',
      hobbies: ['Photography', 'Chess', 'Jazz'],
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      loved: ['The Social Network', 'Spirited Away', 'Arrival', 'The Grand Budapest Hotel'],
      hated: ['Low-budget action', 'Generic streaming thrillers']
    }
  ],
  movies,
  ratings: [],
  likes: []
}

export function ensureUserProfile(user) {
  return {
    ...user,
    loved: user.loved || [],
    hated: user.hated || [],
    hobbies: user.hobbies || []
  }
}

export function addUser(user) {
  store.users.push(user)
}

export function findUserByEmail(email) {
  return store.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase())
}

export function findUserById(id) {
  return store.users.find((user) => user.id === Number(id))
}

export function getMovieById(id) {
  return store.movies.find((movie) => movie.id === Number(id))
}

export function getDailyMovies() {
  return [...store.movies].sort(() => Math.random() - 0.5).slice(0, 5)
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
  }

  if (reaction === 'hate') {
    user.hated = [...new Set([...user.hated, movie.title])]
    user.loved = user.loved.filter((title) => title !== movie.title)
  }

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

export function getMatchesForUser(userId) {
  const user = findUserById(userId)
  if (!user) return []

  return store.users
    .filter((candidate) => candidate.id !== userId)
    .map((candidate) => ({
      ...candidate,
      score: computeCompatibility(user, candidate),
      tasteSummary: buildTasteSummary(user, candidate)
    }))
    .sort((a, b) => b.score - a.score)
}
