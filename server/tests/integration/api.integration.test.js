import test from 'node:test'
import assert from 'node:assert/strict'

const run = process.env.INTEGRATION_TEST === '1'
const base = process.env.INTEGRATION_API_URL || 'http://127.0.0.1:4000'

test(
  'health endpoint responds',
  { skip: !run },
  async () => {
    const res = await fetch(`${base}/api/v1/health`)
    assert.equal(res.ok, true)
    const body = await res.json()
    assert.equal(typeof body.ok, 'boolean')
  }
)

test(
  'platform version endpoint responds',
  { skip: !run },
  async () => {
    const res = await fetch(`${base}/api/v1/platform/version`)
    assert.equal(res.ok, true)
    const body = await res.json()
    assert.equal(body.apiVersion, '1.1.0')
    assert.equal(typeof body.minMobileVersion, 'string')
    assert.equal(typeof body.recommendedMobileVersion, 'string')
  }
)

test(
  'openapi document is served',
  { skip: !run },
  async () => {
    const res = await fetch(`${base}/api/v1/openapi.json`)
    assert.equal(res.ok, true)
    const body = await res.json()
    assert.equal(body.openapi, '3.0.3')
    assert.ok(body.paths['/dating/deck'])
  }
)
