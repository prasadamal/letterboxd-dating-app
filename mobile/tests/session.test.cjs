const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
function session(store, failWrite = false) {
  const exports = {}
  const native = {
    getItemAsync: async key => store.get(key) ?? null,
    setItemAsync: async (key, value) => { if (failWrite) throw new Error('storage failed'); store.set(key, value) },
    deleteItemAsync: async key => store.delete(key)
  }
  const code = ts.transpileModule(fs.readFileSync('lib/session.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(code, { exports, require: name => name === 'react-native' ? { Platform: { OS: 'ios' } } : native })
  return exports
}
test('legacy tokens migrate to one stored pair and logout removes all tokens', async () => {
  const store = new Map([['reelmates_token', 'old'], ['reelmates_refresh_token', 'old-refresh']])
  const s = session(store)
  assert.equal(await s.getAccessToken(), 'old')
  await s.saveTokens('new', 'new-refresh')
  assert.equal(store.size, 1)
  assert.equal(await s.getAccessToken(), 'new')
  assert.equal(await s.getRefreshToken(), 'new-refresh')
  await s.clearTokens()
  assert.equal(await s.getAccessToken(), null)
  assert.equal(await s.getRefreshToken(), null)
})
test('failed pair persistence leaves previous tokens intact', async () => {
  const store = new Map([['reelmates_token', 'old'], ['reelmates_refresh_token', 'old-refresh']])
  const s = session(store, true)
  await assert.rejects(s.saveTokens('new', 'new-refresh'), /storage failed/)
  assert.equal(await s.getAccessToken(), 'old')
  assert.equal(await s.getRefreshToken(), 'old-refresh')
})
