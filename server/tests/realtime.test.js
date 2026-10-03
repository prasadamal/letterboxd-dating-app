import test from 'node:test'
import assert from 'node:assert/strict'
import { chatChannelName } from '../services/realtimeService.js'

test('chatChannelName is stable', () => {
  assert.equal(chatChannelName('abc-123'), 'chat:abc-123')
})
