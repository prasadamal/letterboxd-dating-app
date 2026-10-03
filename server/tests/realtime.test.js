import test from 'node:test'
import assert from 'node:assert/strict'
import { chatChannelName } from '../lib/chatChannel.js'

test('chatChannelName is stable', () => {
  assert.equal(chatChannelName('abc-123'), 'chat:abc-123')
})
