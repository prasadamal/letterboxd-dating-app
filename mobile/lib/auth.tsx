import * as SecureStore from 'expo-secure-store'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from './api'
import type { User } from './types'

const TOKEN_KEY = 'reelmates_token'

type AuthContextValue = {
  user: User | null
  token: string | null
  ready: boolean
  setSession: (token: string, user: User) => Promise<void>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY)
        if (!stored) return
        const data = await apiFetch<{ user: User }>('/auth/me', {}, stored)
        setToken(stored)
        setUser(data.user)
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      async setSession(nextToken, nextUser) {
        await SecureStore.setItemAsync(TOKEN_KEY, nextToken)
        setToken(nextToken)
        setUser(nextUser)
      },
      async refreshUser() {
        if (!token) return
        const data = await apiFetch<{ user: User }>('/auth/me', {}, token)
        setUser(data.user)
      },
      async signOut() {
        await SecureStore.deleteItemAsync(TOKEN_KEY)
        setToken(null)
        setUser(null)
      }
    }),
    [user, token, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function signup(payload: Record<string, unknown>) {
  return apiFetch<{ token: string; user: User }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
