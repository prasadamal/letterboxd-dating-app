import test from 'node:test'
import assert from 'node:assert/strict'
import { chunk, mapLimit, selectAll, selectAllIn } from '../lib/paging.js'

// Mimics PostgREST: honours .range() but never returns more than `cap` rows per request.
function fakeTable(rows, cap = 1000) {
  const calls = []
  const build = (filterIds) => ({
    range(from, to) {
      calls.push({ from, to, ids: filterIds?.length })
      const source = filterIds ? rows.filter((row) => filterIds.includes(row.userId)) : rows
      const end = Math.min(to + 1, from + cap)
      return Promise.resolve({ data: source.slice(from, end), error: null })
    }
  })
  return { build, calls }
}

test('selectAll reads past the server row cap', async () => {
  const rows = Array.from({ length: 2345 }, (_, i) => ({ id: i }))
  const table = fakeTable(rows, 1000)
  const result = await selectAll(() => table.build())
  assert.equal(result.length, 2345)
  assert.deepEqual(result.map((r) => r.id), rows.map((r) => r.id))
})

test('selectAll surfaces query errors', async () => {
  await assert.rejects(
    selectAll(() => ({ range: () => Promise.resolve({ data: null, error: new Error('boom') }) })),
    /boom/
  )
})

test('selectAllIn keeps each id filter short and returns every row', async () => {
  const rows = Array.from({ length: 900 }, (_, i) => ({ userId: `u${i % 450}`, n: i }))
  const ids = Array.from({ length: 450 }, (_, i) => `u${i}`)
  const table = fakeTable(rows)
  const result = await selectAllIn([...ids, ...ids], (part) => table.build(part))
  assert.equal(result.length, 900)
  assert.ok(table.calls.every((call) => call.ids <= 150))
})

test('chunk and mapLimit', async () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
  let active = 0
  let peak = 0
  const out = await mapLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, 5))
    active -= 1
    return n * 2
  })
  assert.deepEqual(out, [2, 4, 6, 8, 10, 12])
  assert.ok(peak <= 2)
})
