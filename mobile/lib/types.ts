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
  countryTarget?: number
  // Signed-in only (/platform/status/me): regional launch for the member's country.
  globalLaunched?: boolean
  regionOnly?: boolean
  country?: CountryProgress | null
  // People who paused dating keep Chats while they still have matches.
  hasMatches?: boolean
}

export type CountryProgress = {
  name: string
  maleCount: number
  femaleCount: number
  target: number
  open: boolean
  openedByAdmin: boolean
  progressPercent: number
}

export type Gender = 'male' | 'female' | 'nonbinary'

export type ProfilePrompt = { key: string; answer: string; question?: string }

export type Streak = { current: number; best: number; playedToday: boolean }

export type User = {
  id: string
  email: string
  name: string
  age: number
  city: string
  country: string
  gender: Gender | 'other' | null
  bio: string
  hobbies: string[]
  avatar_url: string
  photo_url?: string | null
  profile_completion?: number
  matchmaking_enabled?: boolean
  email_verified?: boolean
  discovery_prefs?: { minAge?: number; maxAge?: number; countries?: string[]; minScore?: number }
  interested_in?: Gender[]
  dating_enabled?: boolean
  prompts?: ProfilePrompt[]
  streak?: Streak
  plus?: { active: boolean; until: string | null }
  taste_card_public?: boolean
  referral_code?: string | null
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
  verified_at?: string | null
  loved: string[]
  hated: string[]
  favorite?: { id: number; title: string | null; name?: string | null; year?: number | null; genres?: string[] } | null
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
  // Daily films only: how everyone has rated it so far (revealed after you swipe).
  community?: { likedPercent: number | null; votes: number }
}

export type DatingProfile = User & {
  score: number
  // Films you both rated the same way, rarest first (the core of the match).
  sharedCount?: number
  sharedLoved?: string[]
  sharedHated?: string[]
  favorite?: FavoriteRelation | null
  prompts?: ProfilePrompt[]
  personality?: PersonalityBadgeData | null
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
  unread?: number
  lastActivity?: string
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
  myPersonality?: PersonalityBadgeData | null
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
  personality?: Personality
}

export type PersonalityBadgeData = { key: string; name: string; emoji: string; colors: string[] }

export type Personality = PersonalityBadgeData & {
  tagline: string
  traits: string[]
  ready: boolean
  progress?: { rated: number; needed: number }
}

export type DailyFilmResult = {
  id: number
  title: string
  year: number
  genres: string[]
  origin_language?: string
  myRating: Reaction | null
  likes: number
  dislikes: number
  notSeen: number
  likedPercent: number | null
}

export type DailyResults = {
  day: string
  number: number
  played: number
  total: number
  complete: boolean
  agreed: number
  comparable: number
  mostDivisive: { id: number; title: string; likedPercent: number } | null
  crowdFavourite: { id: number; title: string; likedPercent: number } | null
  shareText: string
  streak: Streak
  films: DailyFilmResult[]
}

export type LikesYou = { count: number; plus: boolean; profiles: DatingProfile[] }
