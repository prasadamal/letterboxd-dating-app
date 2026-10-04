// Supabase (PostgREST) returns at most `max_rows` rows per request (1000 by default) without any error,
// and very long `in.(...)` filters overflow URL limits. These helpers read everything in safe pieces.
export const PAGE_SIZE = 500
export const IN_CHUNK = 150

export function chunk(items, size = IN_CHUNK) {
  const parts = []
  for (let i = 0; i < items.length; i += size) parts.push(items.slice(i, i + size))
  return parts
}

// `buildQuery` must return a fresh query with a deterministic `.order(...)`, or pages can overlap.
export async function selectAll(buildQuery, pageSize = PAGE_SIZE) {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return rows
  }
}

// Like selectAll, for a filter on a (possibly long) list of ids: `buildQuery(idsChunk)`.
export async function selectAllIn(ids, buildQuery, pageSize = PAGE_SIZE) {
  const unique = [...new Set(ids)].filter(Boolean)
  const rows = []
  for (const part of chunk(unique)) rows.push(...(await selectAll(() => buildQuery(part), pageSize)))
  return rows
}

// Runs async work over items with limited concurrency (keeps request fan-out polite).
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
