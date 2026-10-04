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

// The server only broadcasts "something changed" signals (no message content) on these channels.
export function subscribeChatChannel(
  channelName: string,
  handlers: {
    onMessage?: () => void
    onRead?: () => void
  }
) {
  const sb = getClient()
  if (!sb) return () => {}

  const channel: RealtimeChannel = sb
    .channel(channelName, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'message' }, () => handlers.onMessage?.())
    .on('broadcast', { event: 'read' }, () => handlers.onRead?.())
    .subscribe()

  return () => {
    sb.removeChannel(channel)
  }
}
