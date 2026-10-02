import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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
    refreshPlatform().catch(console.error)
    const timer = setInterval(() => refreshPlatform().catch(() => null), 15000)
    return () => clearInterval(timer)
  }, [refreshPlatform])

  const value = useMemo(() => ({ platform, refreshPlatform }), [platform, refreshPlatform])
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
}

export function usePlatform() {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider')
  return ctx
}
