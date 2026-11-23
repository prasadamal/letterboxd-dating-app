const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const exports_ = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/inboxState.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, { exports: exports_ })
const plain = (v) => JSON.parse(JSON.stringify(v))
const { nextInbox, showEmptyInbox } = exports_

test('a failed refresh keeps the chats that were already on screen', () => {
  const loaded = nextInbox({ items: null, failed: false }, { ok: true, items: ['amal', 'arif'] })
  const failed = nextInbox(loaded, { ok: false })
  assert.deepEqual(plain(failed.items), ['amal', 'arif'])
  assert.equal(failed.failed, true)
  assert.equal(showEmptyInbox(failed, 0, false), false)
})

test('first load failing is an error, never "No matches yet"', () => {
  const failed = nextInbox({ items: null, failed: false }, { ok: false })
  assert.equal(failed.items, null)
  assert.equal(showEmptyInbox(failed, 0, true), false)
})

test('empty state only after a successful empty answer', () => {
  const empty = nextInbox({ items: null, failed: false }, { ok: true, items: [] })
  assert.equal(showEmptyInbox(empty, 0, false), true)
  assert.equal(showEmptyInbox(empty, 2, false), false, 'someone likes you')
  assert.equal(showEmptyInbox(empty, 0, true), false, 'likes request failed, so we cannot be sure')
})

test('a later success clears the error', () => {
  const r = nextInbox({ items: ['x'], failed: true }, { ok: true, items: ['x', 'y'] })
  assert.deepEqual(plain(r), { items: ['x', 'y'], failed: false })
})
