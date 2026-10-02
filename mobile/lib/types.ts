export type User = {
  id: string
  email: string
  name: string
  age: number
  city: string
  bio: string
  hobbies: string[]
  avatar_url: string
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

export type Match = User & {
  score: number
  tasteSummary?: string
}

export type ChatMessage = {
  id: number | string
  from_user_id: string
  to_user_id: string
  text: string
  created_at: string
}
