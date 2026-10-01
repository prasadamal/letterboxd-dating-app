import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function run(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['server/index.js'], { cwd: root, env: { PATH: process.env.PATH, ...env } })
    let out = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('exit', (code) => resolve({ code, out }))
    child.on('spawn', () => setTimeout(() => { if (child.exitCode === null) { child.kill('SIGTERM') } }, 1500))
  })
}

test('server process refuses to start in production with the default JWT_SECRET', async () => {
  const { code, out } = await run({ NODE_ENV: 'production', PORT: '0', JWT_SECRET: 'change-this-secret-for-production' })
  assert.notEqual(code, 0)
  assert.match(out, /JWT_SECRET must be set/)
})

test('production serves the built SPA and the API from one process', { skip: !fs.existsSync(path.join(root, 'dist', 'index.html')) && 'dist/ not built (run `npm run build`)' }, async () => {
  const port = 4300 + Math.floor(Math.random() * 500)
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: root,
    env: { PATH: process.env.PATH, NODE_ENV: 'production', PORT: String(port), JWT_SECRET: 'a-sufficiently-long-test-secret' }
  })
  try {
    let base
    for (let i = 0; i < 50; i += 1) {
      try { const r = await fetch(`http://127.0.0.1:${port}/api/health`); if (r.ok) { base = `http://127.0.0.1:${port}`; break } } catch { /* retry */ }
      await new Promise((r) => setTimeout(r, 100))
    }
    assert.ok(base, 'server did not start')
    const index = await fetch(`${base}/`)
    assert.equal(index.status, 200)
    assert.match(await index.text(), /<div id="root">/)
    const deep = await fetch(`${base}/some/client/route`)
    assert.equal(deep.status, 200)
    assert.match(deep.headers.get('content-type'), /html/)
    const missingApi = await fetch(`${base}/api/missing`)
    assert.equal(missingApi.status, 404)
    assert.match(missingApi.headers.get('content-type'), /json/)
  } finally {
    child.kill('SIGTERM')
  }
})
