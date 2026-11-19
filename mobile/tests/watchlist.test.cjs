const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const mod = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/watchlistState.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: mod, Set })
const { initialWatch, startToggle, settleToggle, replaceIds } = mod
const ids = (s) => [...s.ids].sort((a, b) => a - b)

test('nobody signed in cannot save, and a double tap sends one request', () => {
  assert.equal(startToggle(initialWatch(null), 7), null)
  const first = startToggle(initialWatch('u1'), 7)
  assert.equal(first.saving, true)
  assert.deepEqual(ids(first.next), [7])
  assert.equal(startToggle(first.next, 7), null)
})

test('a failed save or removal puts the film back the way it was', () => {
  const saved = startToggle(initialWatch('u1'), 7)
  const failedSave = settleToggle(saved.next, 'u1', 7, true, false)
  assert.deepEqual(ids(failedSave), [])
  assert.equal(failedSave.pending.size, 0)
  const kept = settleToggle(saved.next, 'u1', 7, true, true)
  const removing = startToggle(kept, 7)
  assert.equal(removing.saving, false)
  assert.deepEqual(ids(settleToggle(removing.next, 'u1', 7, false, false)), [7])
})

test('replies for another account are ignored', () => {
  const saved = startToggle(initialWatch('u1'), 7)
  const switched = initialWatch('u2')
  assert.equal(settleToggle(switched, 'u1', 7, true, true), switched)
  assert.equal(replaceIds(switched, 'u1', [7, 8]), switched)
  assert.deepEqual(ids(replaceIds(saved.next, 'u1', [8, 9])), [7, 8, 9])
})

test('a refresh does not undo a change still in flight', () => {
  const kept = settleToggle(startToggle(initialWatch('u1'), 7).next, 'u1', 7, true, true)
  const removing = startToggle(kept, 7)
  // The server list was read before the removal landed and still contains 7.
  assert.deepEqual(ids(replaceIds(removing.next, 'u1', [7, 8])), [8])
})
