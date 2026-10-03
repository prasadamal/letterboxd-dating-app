import { supabase } from '../supabaseClient.js'
import { logger } from '../lib/logger.js'
import { chatChannelName } from '../lib/chatChannel.js'

export { chatChannelName } from '../lib/chatChannel.js'

export async function broadcastChatEvent(conversationId, event, payload) {
  if (!conversationId) return
  const channel = supabase.channel(chatChannelName(conversationId), {
    config: { broadcast: { self: false } }
  })

  try {
    await new Promise((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve(null)
        if (status === 'CHANNEL_ERROR') reject(new Error('Realtime channel error'))
      })
    })

    await channel.send({ type: 'broadcast', event, payload })
  } catch (error) {
    logger.warn('Realtime broadcast failed', { conversationId, event, message: error.message })
  } finally {
    supabase.removeChannel(channel)
  }
}
