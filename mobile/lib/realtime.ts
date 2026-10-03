import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import Constants from 'expo-constants'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || (Constants.expoConfig?.extra?.supabaseUrl as string | undefined)
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined)

let client: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!url || !anonKey) return null
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }
  return client
}

export function subscribeChatChannel(
  channelName: string,
  handlers: {
    onMessage?: (payload: unknown) => void
    onRead?: (payload: unknown) => void
  }
) {
  const sb = getClient()
  if (!sb) return () => {}

  const channel: RealtimeChannel = sb
    .channel(channelName, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'message' }, ({ payload }) => handlers.onMessage?.(payload))
    .on('broadcast', { event: 'read' }, ({ payload }) => handlers.onRead?.(payload))
    .subscribe()

  return () => {
    sb.removeChannel(channel)
  }
}
