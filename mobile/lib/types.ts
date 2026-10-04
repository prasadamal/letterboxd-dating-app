export type PlatformStatus = {
  maleCount: number
  femaleCount: number
  otherCount: number
  maleTarget: number
  femaleTarget: number
  totalRegistered: number
  datingLaunched: boolean
  datingLaunchedAt: string | null
  progressPercent: number
}

export type User = {
  id: string
  email: string
  name: string
  age: number
  city: string
  country: string
  gender: 'male' | 'female' | 'other' | null
  bio: string
  hobbies: string[]
  avatar_url: string
  photo_url?: string | null
  profile_completion?: number
  matchmaking_enabled?: boolean
  email_verified?: boolean
  discovery_prefs?: { minAge?: number; maxAge?: number; countries?: string[] }
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
  verified_at?: string | null
  loved: string[]
  hated: string[]
  favorite?: { id: number; title: string | null } | null
}

export type Reaction = 'love' | 'hate' | 'skip'

export type FavoriteRelation = { title: string; relation: 'same' | 'you_liked' | 'you_disliked' | 'not_rated' }

export type Movie = {
  id: number
  title: string
  year: number
  genres?: string[]
  origin_language?: string
  popularity?: number
}

export type DatingProfile = User & {
  score: number
  // Films you both rated the same way, rarest first (the core of the match).
  sharedCount?: number
  sharedLoved?: string[]
  sharedHated?: string[]
  favorite?: FavoriteRelation | null
  tasteSummary?: string
  likedLine?: string | null
  dislikedLine?: string | null
}

export type Match = DatingProfile & {
  matchId?: string | number
  chatUnlocked?: boolean
  introPending?: boolean
}

export type ConversationPreview = {
  matchId: string | number
  peer: { id: string; name: string; age?: number; avatar_url?: string | null }
  compatibility: number
  chatUnlocked: boolean
  lastMessage: { text: string; at: string; fromSelf: boolean } | null
}

export type ChatMessage = {
  id: number | string
  from_user_id: string
  to_user_id: string
  text: string
  created_at: string
  read_at?: string | null
}

export type FilmItem = {
  id: number
  title: string
  year: number
  genres: string[]
  origin_language?: string
  tags: string[]
  myRating: Reaction | null
  // People's chart only
  rank?: number | null
  likedPercent?: number | null
  votes?: number
}

export type Collection = { key: string; name: string; count: number }

export type Friend = DatingProfile

export type TasteComparison = {
  person: DatingProfile
  score: number
  sharedCount: number
  conflicts: number
  sharedLoved: string[]
  sharedHated: string[]
  theirFavorite: FavoriteRelation | null
  myFavorite: string | null
  watchTogether: { forYou: string[]; forThem: string[] }
}

export type TasteStats = {
  liked: number
  disliked: number
  notSeen: number
  likeRate: number | null
  topGenres: { name: string; count: number }[]
  topLanguages: { name: string; count: number }[]
  topDecades: { name: string; count: number }[]
  leastLikedGenres: { name: string; count: number }[]
}
