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
}

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
