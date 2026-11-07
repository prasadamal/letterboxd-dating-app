const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
function client(fetch) {
  let clears = 0
  const session = { getAccessToken: async () => 'old', getRefreshToken: async () => 'refresh', clearTokens: async () => { clears++ }, saveTokens: async () => {} }
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync('lib/api.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(code, { exports, require: name => name === 'expo-constants' ? { default: {} } : session, process: { env: { EXPO_PUBLIC_API_URL: 'https://api.test/api' } }, __DEV__: false, fetch, AbortController, setTimeout, clearTimeout })
  return { ...exports, clears: () => clears }
}
const response = (status, body = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => body })
test('offline refresh preserves saved credentials', async () => {
  const api = client(async url => { if (url.endsWith('/refresh')) throw new Error('offline'); return response(401) })
  await assert.rejects(api.apiFetch('/auth/me'), error => error.code === 'NETWORK' && error.status === 0)
  assert.equal(api.clears(), 0)
})
test('temporary server refresh failure preserves credentials', async () => {
  const api = client(async url => response(url.endsWith('/refresh') ? 503 : 401))
  await assert.rejects(api.apiFetch('/auth/me'), error => error.status === 503)
  assert.equal(api.clears(), 0)
})
test('rejected refresh clears saved credentials', async () => {
  const api = client(async () => response(401))
  await assert.rejects(api.apiFetch('/auth/me'), error => error.status === 401)
  assert.equal(api.clears(), 1)
})
test('simultaneous expired requests share a single refresh', async () => {
  let refreshes = 0
  const api = client(async (url, options) => {
    if (url.endsWith('/refresh')) { refreshes++; await new Promise(resolve => setTimeout(resolve, 10)); return response(200, { token: 'new', refreshToken: 'next' }) }
    return options.headers.Authorization === 'Bearer new' ? response(200, { ok: true }) : response(401)
  })
  const results = await Promise.all([api.apiFetch('/users/profile'), api.apiFetch('/auth/me')])
  assert.ok(results.every(result => result.ok))
  assert.equal(refreshes, 1)
})
