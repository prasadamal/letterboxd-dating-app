/** Client projection of the server's hello gate. The API remains authoritative. */
export type ChatAccess = 'loading' | 'intro' | 'waiting' | 'open' | 'closed'

export type ChatGate = {
  chatUnlocked?: boolean
  introPending?: boolean
  waitingOnPeer?: boolean
}

export function chatAccess(gate: ChatGate): ChatAccess {
  if (gate.chatUnlocked) return 'open'
  if (gate.waitingOnPeer) return 'waiting'
  if (gate.introPending) return 'intro'
  // A locked gate without permission to introduce is not permission to send.
  return 'waiting'
}

export function canSendChat(access: ChatAccess) {
  return access === 'intro' || access === 'open'
}
