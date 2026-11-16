// Run each node:test module directly in its own process. This avoids file-only success
// reports observed with the isolated --test runner, while preserving per-file env isolation.
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../server/tests')
const integrationOnly = process.argv.includes('--integration')
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name))
      : entry.name.endsWith('.test.js') ? [path.join(directory, entry.name)] : [])
}
const selected = files(integrationOnly ? path.join(root, 'integration') : root)
if (!selected.length) throw new Error('No test modules found')
let failed = 0
for (const file of selected) {
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit', env: process.env })
  if (result.error || result.status !== 0) failed++
}
console.log(`Executed ${selected.length} test modules; ${failed} failed.`)
process.exitCode = failed ? 1 : 0
