import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHealthHandler } from '../health.js'

async function health(run) {
  const database = { from: (table) => ({ select: (columns) => ({ limit: () => ({ abortSignal: () => run(table, columns) }) }) }) }
  let status, body
  const response = { status(value) { status = value; return this }, json(value) { body = value } }
  await createHealthHandler({ database, configuration: { NODE_ENV: 'production' }, missingConfig: () => [] })({}, response)
  return { status, body }
}
test('readiness accepts a healthy database', async () => {
  const result = await health(async () => ({ error: null }))
  assert.equal(result.status, 200)
  assert.equal(result.body.db, 'up')
})
test('readiness fails for a database error without leaking its details', async () => {
  const result = await health(async () => ({ error: { message: 'private database detail' } }))
  assert.equal(result.status, 503)
  assert.equal(result.body.ok, false)
  assert.ok(!JSON.stringify(result.body).includes('private database detail'))
})
test('readiness catches transport failures', async () => {
  assert.equal((await health(async () => { throw new Error('network down') })).status, 503)
})
test('readiness fails with a clear reason while the auth migration is not applied', async () => {
  const result = await health(async (table) => (table === 'users' ? { error: { message: 'column users.auth_version does not exist' } } : { error: null }))
  assert.equal(result.status, 503)
  assert.equal(result.body.db, 'migration_pending')
  assert.ok(!JSON.stringify(result.body).includes('does not exist'))
})
