import test from 'node:test'
import assert from 'node:assert/strict'
import { API_VERSION, MIN_MOBILE_VERSION, RECOMMENDED_MOBILE_VERSION } from '../lib/version.js'

test('release version constants are set', () => {
  assert.equal(API_VERSION, '1.1.0')
  assert.match(MIN_MOBILE_VERSION, /^\d+\.\d+\.\d+$/)
  assert.equal(RECOMMENDED_MOBILE_VERSION, '1.1.0')
})
