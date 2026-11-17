const test = require('node:test')
const assert = require('node:assert/strict')
const { releaseConfig } = require('../scripts/release-config.cjs')
const env = { EXPO_PUBLIC_API_URL: 'https://api.reelmates.test/api/v1', EXPO_PUBLIC_WEB_URL: 'https://reelmates.test', EXPO_PUBLIC_EAS_PROJECT_ID: '12345678-1234-1234-1234-123456789abc' }
test('release config requires usable API, web and project identity', () => {
  assert.equal(releaseConfig(env).api, env.EXPO_PUBLIC_API_URL)
  for (const url of ['', 'http://api.test/api', 'https://YOUR_PRODUCTION_API_HOST/api', 'https://localhost/api', 'https://user:pass@host.test/api', 'https://host.test/wrong']) {
    assert.throws(() => releaseConfig({ ...env, EXPO_PUBLIC_API_URL: url }))
  }
  assert.throws(() => releaseConfig({ ...env, EXPO_PUBLIC_EAS_PROJECT_ID: '' }))
  assert.throws(() => releaseConfig({ ...env, EXPO_PUBLIC_WEB_URL: '' }))
})
