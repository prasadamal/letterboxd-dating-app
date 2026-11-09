const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const exports_ = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/chatState.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, { exports: exports_ })
const { chatAccess, canSendChat } = exports_

test('hello gating only allows the introduction or an unlocked chat', () => {
  assert.equal(chatAccess({ introPending: true, chatUnlocked: false }), 'intro')
  assert.equal(chatAccess({ waitingOnPeer: true, chatUnlocked: false }), 'waiting')
  assert.equal(chatAccess({ chatUnlocked: true }), 'open')
  for (const state of ['loading', 'waiting', 'closed']) assert.equal(canSendChat(state), false)
  for (const state of ['intro', 'open']) assert.equal(canSendChat(state), true)
})

test('missing or contradictory legacy hello flags never allow another introduction', () => {
  assert.equal(chatAccess({}), 'waiting')
  assert.equal(chatAccess({ waitingOnPeer: true, introPending: true }), 'waiting')
  assert.equal(chatAccess({ chatUnlocked: true, waitingOnPeer: true }), 'open')
})
