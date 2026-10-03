#!/usr/bin/env node
const base = process.env.SMOKE_API_URL || 'http://127.0.0.1:4000'

async function check(name, url, init, expect) {
  const res = await fetch(url, init)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 120)
  }
  const ok = expect(res, body)
  if (!ok) {
    console.error(`FAIL ${name}`, res.status, typeof body === 'string' ? body : JSON.stringify(body).slice(0, 240))
    process.exitCode = 1
    return
  }
  console.log(`OK   ${name}`)
}

await check('health', `${base}/api/v1/health`, {}, (res, body) => res.ok && body.ok === true && body.db === 'up')
await check('platform', `${base}/api/v1/platform/status`, {}, (res) => res.ok)
await check('docs', `${base}/api/v1/docs/`, {}, (res) => res.status === 200)
await check('openapi', `${base}/api/v1/openapi.json`, {}, (res, body) => res.ok && body.openapi === '3.0.3')

if (process.exitCode) {
  console.error('Smoke failed. Confirm SUPABASE_SERVICE_ROLE_KEY is set and the API is running.')
}
