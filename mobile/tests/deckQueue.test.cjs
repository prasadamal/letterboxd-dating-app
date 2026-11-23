const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const exports_ = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/deckQueue.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, { exports: exports_ })
const plain = (v) => JSON.parse(JSON.stringify(v))
const { visibleQueue, restoreFailed } = exports_

const films = [{ id: 1 }, { id: 2 }, { id: 3 }]
const ids = (q) => q.map((f) => f.id)

// Simulates the deck + parent: swipe 1 then 2 quickly, saves resolve in reverse order.
test('two fast swipes with responses in reverse order never bring a film back', () => {
  const inFlight = new Set()
  let parent = films
  let queue = visibleQueue(parent, inFlight)
  inFlight.add(1); queue = queue.slice(1)            // swipe 1
  inFlight.add(2); queue = queue.slice(1)            // swipe 2
  // save of 2 finishes first: parent drops 2, deck re-syncs from parent
  parent = parent.filter((f) => f.id !== 2); queue = visibleQueue(parent, inFlight); inFlight.delete(2)
  assert.deepEqual(plain(ids(queue)), [3], 'film 1 is still saving, so it must not reappear')
  parent = parent.filter((f) => f.id !== 1); queue = visibleQueue(parent, inFlight); inFlight.delete(1)
  assert.deepEqual(plain(ids(queue)), [3])
})

test('one save fails: that film returns to the front, the other stays rated', () => {
  const inFlight = new Set([1, 2])
  let parent = films
  let queue = [{ id: 3 }]
  parent = parent.filter((f) => f.id !== 2); queue = visibleQueue(parent, inFlight); inFlight.delete(2) // 2 saved
  inFlight.delete(1); queue = restoreFailed(queue, { id: 1 })                                      // 1 failed
  assert.deepEqual(plain(ids(queue)), [1, 3])
  assert.deepEqual(plain(ids(visibleQueue(parent, inFlight))), [1, 3], 'a later parent update agrees')
})
