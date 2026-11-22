// One-time import of freely licensed film posters from Wikimedia Commons into server/data/posters.json.
//   node server/scripts/importPosters.js
// Only posters whose licence allows reuse in an app are kept: public domain, CC0, CC BY and CC BY-SA.
// Each keeps its author and licence, which the apps show as a small credit (required for CC BY/BY-SA).
// Most modern posters are not on Commons (studios own them); those films keep the typographic poster.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data')
const UA = 'ReelMatesCatalogImport/1.0 (one-time poster import)'
const FREE = /^(public domain|pd[- ]|cc0|cc[- ]by(-sa)?[- ]?\d|cc by(-sa)? \d)/i
// Modern studio posters whose "free" label on Commons is doubtful: not worth the risk in an app.
const DOUBTFUL = new Set(['Dunkirk|2017', 'Battle Royale|2000'])
const NOT_A_POSTER = /theat(er|re) ad|playhouse ad|\bad\b|advert|logo|still|trailer/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const strip = (html) => String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

async function getJson(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  const text = await res.text()
  // Commons answers "You are making too many requests" (sometimes with status 200): wait and retry.
  const limited = res.status === 429 || res.status >= 500 || /too many requests/i.test(text.slice(0, 200))
  if (limited && attempt < 7) {
    await sleep(15000 * attempt)
    return getJson(url, attempt + 1)
  }
  if (!res.ok || limited) throw new Error(`${res.status} for ${url.slice(0, 80)}`)
  return JSON.parse(text)
}

const facts = JSON.parse(fs.readFileSync(path.join(DATA, 'wikidataFacts.json'), 'utf8')).films
const byQid = new Map(Object.entries(facts).map(([key, f]) => [f.qid, key]))
const qids = [...byQid.keys()]

// 1. Candidate files: the film's poster (P3383), or its image (P18) when the file name says poster.
const files = new Map()
for (let i = 0; i < qids.length; i += 150) {
  const values = qids.slice(i, i + 150).map((q) => `wd:${q}`).join(' ')
  const query = `SELECT ?f ?poster ?image WHERE { VALUES ?f { ${values} } OPTIONAL { ?f wdt:P3383 ?poster } OPTIONAL { ?f wdt:P18 ?image } }`
  const data = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`)
  for (const row of data.results.bindings) {
    const key = byQid.get(row.f.value.split('/').pop())
    const pick = row.poster?.value || (row.image && /poster/i.test(decodeURIComponent(row.image.value)) ? row.image.value : null)
    // Links look like …/wiki/Special:FilePath/<file>; "unknown value" entries are …/genid/… and are skipped.
    if (key && pick && pick.includes('FilePath/') && !files.has(key)) files.set(key, decodeURIComponent(pick.split('FilePath/').pop()))
  }
}
console.log(`${files.size} films have a poster file on Commons; checking licences…`)

// 2. Licence, author and a 500px image for each file.
const posters = {}
const rejected = []
const entries = [...files.entries()]
for (let i = 0; i < entries.length; i += 1) {
  // One file per request: with several, Commons returns licence details for only some of them.
  const batch = entries.slice(i, i + 1)
  const titles = batch.map(([, file]) => `File:${file}`).join('|')
  const data = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&titles=${encodeURIComponent(titles)}`
  )
  const pages = Object.values(data.query?.pages || {})
  const norm = new Map((data.query?.normalized || []).map((n) => [n.to, n.from]))
  for (const [key, file] of batch) {
    const page = pages.find((p) => p.title === `File:${file}` || norm.get(p.title) === `File:${file}` || p.title.replace(/_/g, ' ') === `File:${file}`.replace(/_/g, ' '))
    const info = page?.imageinfo?.[0]
    const meta = info?.extmetadata || {}
    const license = strip(meta.LicenseShortName?.value)
    const tall = info && (info.thumbheight || info.height) / (info.thumbwidth || info.width) >= 1.25
    const reason = !info || !FREE.test(license) ? license || 'no licence info'
      : DOUBTFUL.has(key) ? `doubtful licence: ${license}`
      : NOT_A_POSTER.test(file) ? 'not a poster (ad, logo or still)'
      : !tall ? 'not poster-shaped'
      : null
    if (reason) {
      rejected.push(`${key} (${reason})`)
      continue
    }
    posters[key] = {
      image: info.thumburl || info.url,
      width: info.thumbwidth || info.width,
      height: info.thumbheight || info.height,
      license,
      author: strip(meta.Artist?.value).slice(0, 120) || null,
      source: info.descriptionurl
    }
  }
  await sleep(2500)
}

fs.writeFileSync(path.join(DATA, 'posters.json'), JSON.stringify({ source: 'Wikimedia Commons (free licences only)', imported: new Date().toISOString().slice(0, 10), films: posters }, null, 1) + '\n')
console.log(`Kept ${Object.keys(posters).length} posters. Skipped ${rejected.length} (licence not free or unknown): ${rejected.join('; ')}`)
