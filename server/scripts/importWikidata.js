// One-time import of film facts from Wikidata (CC0: free to copy, no credit required) into
// server/data/wikidataFacts.json. The app reads the file; it never calls Wikidata at runtime.
//   node server/scripts/importWikidata.js            (re-run any time to refresh)
// For each catalog film: the Wikidata film with the same English title and a release year within
// one year; then directors, the five best-known cast members, runtime, countries and IMDb id.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { movieCatalog } from '../movieCatalog.js'

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/wikidataFacts.json')
const ENDPOINT = 'https://query.wikidata.org/sparql'
const UA = 'ReelMatesCatalogImport/1.0 (one-time catalog import)'
const FILM_TYPES = 'wd:Q11424 wd:Q24869 wd:Q202866 wd:Q93204 wd:Q20650540 wd:Q29168811 wd:Q226730 wd:Q1257444'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function sparql(query, attempt = 1) {
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA } })
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 4) throw new Error(`Wikidata ${res.status}`)
    await sleep(3000 * attempt)
    return sparql(query, attempt + 1)
  }
  if (!res.ok) throw new Error(`Wikidata ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).results.bindings
}
const lit = (s) => JSON.stringify(s)
const qid = (uri) => uri.split('/').pop()

async function findItems(films, property = 'rdfs:label') {
  // Famous films often keep their name in Wikidata's language-neutral "mul" label instead of "en".
  const values = films.flatMap((f) => [`${lit(f.title)}@en`, `${lit(f.title)}@mul`]).join(' ')
  const rows = await sparql(`SELECT ?title ?f (MIN(YEAR(?d)) AS ?y) (SAMPLE(?sl) AS ?links) WHERE {
    VALUES ?title { ${values} } VALUES ?type { ${FILM_TYPES} }
    ?f ${property} ?title ; wdt:P31 ?type ; wdt:P577 ?d . OPTIONAL { ?f wikibase:sitelinks ?sl }
  } GROUP BY ?title ?f`)
  const out = new Map()
  for (const f of films) {
    const candidates = rows
      .filter((r) => r.title.value === f.title && r.y && Math.abs(Number(r.y.value) - f.year) <= 1)
      .sort((a, b) => Math.abs(Number(a.y.value) - f.year) - Math.abs(Number(b.y.value) - f.year) || Number(b.links?.value || 0) - Number(a.links?.value || 0))
    if (candidates[0]) out.set(f.id, qid(candidates[0].f.value))
  }
  return out
}

async function details(qids) {
  const values = qids.map((q) => `wd:${q}`).join(' ')
  const [scalars, directors, cast] = await Promise.all([
    sparql(`SELECT ?f (SAMPLE(?imdb) AS ?imdb) (MAX(?rt) AS ?runtime) (GROUP_CONCAT(DISTINCT ?cl; separator="|") AS ?countries) WHERE {
      VALUES ?f { ${values} }
      OPTIONAL { ?f wdt:P345 ?imdb } OPTIONAL { ?f wdt:P2047 ?rt }
      OPTIONAL { ?f wdt:P495 ?c . ?c rdfs:label ?cl . FILTER(LANG(?cl) IN ("en", "mul")) }
    } GROUP BY ?f`),
    sparql(`SELECT ?f ?pl WHERE { VALUES ?f { ${values} } ?f wdt:P57 ?p . ?p rdfs:label ?pl . FILTER(LANG(?pl) IN ("en", "mul")) }`),
    sparql(`SELECT ?f ?pl ?sl WHERE { VALUES ?f { ${values} } ?f wdt:P161 ?p . ?p rdfs:label ?pl ; wikibase:sitelinks ?sl . FILTER(LANG(?pl) IN ("en", "mul")) }`)
  ])
  const out = new Map(qids.map((q) => [q, { qid: q, directors: [], cast: [] }]))
  for (const r of scalars) {
    const d = out.get(qid(r.f.value))
    if (r.imdb) d.imdb = r.imdb.value
    if (r.runtime) d.runtime = Math.round(Number(r.runtime.value))
    d.countries = r.countries?.value ? r.countries.value.split('|').sort() : []
  }
  for (const r of directors) {
    const d = out.get(qid(r.f.value))
    if (!d.directors.includes(r.pl.value)) d.directors.push(r.pl.value)
  }
  const castBy = new Map()
  for (const r of cast) {
    const list = castBy.get(qid(r.f.value)) || []
    list.push({ name: r.pl.value, fame: Number(r.sl.value) })
    castBy.set(qid(r.f.value), list)
  }
  for (const [q, list] of castBy) {
    out.get(q).cast = [...new Map(list.map((c) => [c.name, c])).values()].sort((a, b) => b.fame - a.fame).slice(0, 5).map((c) => c.name)
  }
  return out
}

const facts = {}
const missing = []
const BATCH = 25
for (let i = 0; i < movieCatalog.length; i += BATCH) {
  const films = movieCatalog.slice(i, i + BATCH)
  const found = await findItems(films)
  // Second pass for the rest: their alternative names (Se7en is "Seven", Empire is "Star Wars: Episode V…").
  const rest = films.filter((f) => !found.has(f.id))
  if (rest.length) for (const [id, q] of await findItems(rest, 'skos:altLabel')) found.set(id, q)
  const info = found.size ? await details([...new Set(found.values())]) : new Map()
  for (const f of films) {
    const q = found.get(f.id)
    if (!q) missing.push(`${f.title} (${f.year})`)
    else facts[`${f.title}|${f.year}`] = info.get(q)
  }
  process.stdout.write(`\r${Math.min(i + BATCH, movieCatalog.length)}/${movieCatalog.length} films, ${missing.length} not found`)
  await sleep(500)
}
fs.writeFileSync(OUT, JSON.stringify({ source: 'Wikidata (CC0)', imported: new Date().toISOString().slice(0, 10), films: facts }, null, 1) + '\n')
console.log(`\nWrote ${Object.keys(facts).length} films to ${path.relative(process.cwd(), OUT)}`)
if (missing.length) console.log(`Not found (${missing.length}): ${missing.join('; ')}`)
