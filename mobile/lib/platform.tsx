import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { apiFetch } from './api'
import type { PlatformStatus } from './types'
import { useAuth } from './auth'

const PlatformContext = createContext<{
  platform: PlatformStatus | null
  refreshPlatform: () => Promise<void>
} | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [platform, setPlatform] = useState<PlatformStatus | null>(null)

  const refreshPlatform = useCallback(async () => {
    if (!token) {
      const data = await apiFetch<PlatformStatus>('/platform/status')
      setPlatform(data)
      return
    }
    const data = await apiFetch<PlatformStatus>('/platform/status/me', {}, token)
    setPlatform(data)
  }, [token])

  useEffect(() => {
    refreshPlatform().catch(() => null)
    // Poll only while the app is in the foreground; refresh immediately when it comes back.
    let timer: ReturnType<typeof setInterval> | null = setInterval(() => refreshPlatform().catch(() => null), 60000)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPlatform().catch(() => null)
        if (!timer) timer = setInterval(() => refreshPlatform().catch(() => null), 60000)
      } else if (timer) {
        clearInterval(timer)
        timer = null
      }
    })
    return () => {
      if (timer) clearInterval(timer)
      sub.remove()
    }
  }, [refreshPlatform])

  const value = useMemo(() => ({ platform, refreshPlatform }), [platform, refreshPlatform])
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider')
  return ctx
}
