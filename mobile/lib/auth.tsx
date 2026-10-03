import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from './api'
import { registerDevicePushToken } from './push'
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './session'
import type { PlatformStatus, User } from './types'

type AuthContextValue = {
  user: User | null
  token: string | null
  platform: PlatformStatus | null
  ready: boolean
  setSession: (
    token: string,
    user: User,
    platform?: PlatformStatus | null,
    refreshToken?: string | null
  ) => Promise<void>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [platform, setPlatform] = useState<PlatformStatus | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await getAccessToken()
        if (!stored) return
        const data = await apiFetch<{ user: User; platform: PlatformStatus }>('/auth/me', {}, stored)
        setToken(stored)
        setUser(data.user)
        setPlatform(data.platform)
        registerDevicePushToken(stored).catch(() => null)
      } catch {
        await clearTokens()
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      platform,
      ready,
      async setSession(nextToken, nextUser, nextPlatform = null, refreshToken = null) {
        await saveTokens(nextToken, refreshToken)
        setToken(nextToken)
        setUser(nextUser)
        if (nextPlatform) setPlatform(nextPlatform)
        registerDevicePushToken(nextToken).catch(() => null)
      },
      async refreshUser() {
        if (!token) return
        const data = await apiFetch<{ user: User; platform: PlatformStatus }>('/auth/me', {}, token)
        setUser(data.user)
        setPlatform(data.platform)
      },
      async signOut() {
        const refreshToken = await getRefreshToken()
        if (refreshToken) {
          try {
            await apiFetch('/auth/logout', {
              method: 'POST',
              body: JSON.stringify({ refreshToken })
            })
          } catch {
            // still clear local session
          }
        }
        await clearTokens()
        setToken(null)
        setUser(null)
        setPlatform(null)
      }
    }),
    [user, token, platform, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; refreshToken: string; user: User; platform: PlatformStatus }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function signup(payload: Record<string, unknown>) {
  return apiFetch<{ token: string; refreshToken: string; user: User; platform: PlatformStatus }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
