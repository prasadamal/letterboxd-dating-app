import assert from 'node:assert/strict'
import test from 'node:test'
process.env.JWT_SECRET = 'test-only-secret-for-isolated-tests'
process.env.SUPABASE_URL = 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-service-key-not-real'
const { AppError, errorHandler } = await import('../middleware/errors.js')

function run(error) {
  let status
  let body
  const res = { status(value) { status = value; return this }, json(value) { body = value } }
  errorHandler(error, { requestId: 'req-1', log: { error() {} } }, res, () => {})
  return { status, body }
}

test('a database error never reaches the caller', () => {
  // Shape of a Supabase/PostgREST error: SQLSTATE in `code`, row contents in `details`.
  const db = Object.assign(new Error('null value in column "family_id" violates not-null constraint'), {
    code: '23502',
    details: 'Failing row contains (fc7ce954, eb8c5877, 6a1f…password-hash-or-token…)',
    hint: 'internal hint'
  })
  const { status, body } = run(db)
  assert.equal(status, 500)
  assert.deepEqual(Object.keys(body).sort(), ['code', 'message', 'requestId'])
  assert.equal(body.code, 'INTERNAL_ERROR')
  assert.equal(body.message, 'Internal server error')
  assert.ok(!JSON.stringify(body).match(/Failing row|family_id|23502|hint/))
})

test('an unexpected exception keeps the request id for support', () => {
  assert.equal(run(new Error('boom')).body.requestId, 'req-1')
})

test('errors raised on purpose keep their message, code and details', () => {
  const { status, body } = run(new AppError('Name is required', 422, 'VALIDATION_ERROR', { name: ['Required'] }))
  assert.equal(status, 422)
  assert.equal(body.code, 'VALIDATION_ERROR')
  assert.deepEqual(body.details, { name: ['Required'] })
})

test('a deliberate server-side AppError shows its code but still no details', () => {
  const { status, body } = run(new AppError('Could not reach storage', 503, 'STORAGE_DOWN', { internal: 'bucket path' }))
  assert.equal(status, 503)
  assert.equal(body.code, 'STORAGE_DOWN')
  assert.equal(body.message, 'Internal server error')
  assert.equal(body.details, undefined)
})
