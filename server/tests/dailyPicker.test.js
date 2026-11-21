import test from 'node:test'
import assert from 'node:assert/strict'
import { movieCatalog } from '../movieCatalog.js'
import { filmFacts, FACE_OFFS, SIGNATURE_DIRECTORS } from '../data/filmFacts.js'
import { enrichFilm, factsKey } from '../lib/films/filmFeatures.js'
import { filmOdds, informativeness, oddsByFilm, seenPrior } from '../lib/films/filmStats.js'
import { pickDailySet } from '../lib/films/dailyPicker.js'

const films = movieCatalog.map(enrichFilm)
const byId = new Map(films.map((f) => [f.id, f]))
const odds = oddsByFilm(films, new Map())
const DAY = 20800

function run(days, start = DAY) {
  const history = []
  const out = []
  for (let d = start; d < start + days; d += 1) {
    const picked = pickDailySet({ films, odds, dayNumber: d, history })
    out.push({ day: d, ...picked })
    history.push({ dayNumber: d, ids: picked.films.map((p) => p.id) })
  }
  return out
}
const year = run(120)

test('every film fact belongs to a catalog film (catches typos in titles or years)', () => {
  const keys = new Set(movieCatalog.map(factsKey))
  const unknown = Object.keys(filmFacts).filter((k) => !keys.has(k))
  assert.deepEqual(unknown, [])
  for (const d of SIGNATURE_DIRECTORS) assert.ok(films.some((f) => f.director === d), `no film by ${d}`)
  for (const f of FACE_OFFS) for (const side of [f.a, f.b]) assert.ok(films.some((x) => x.family === side.family || x.director === side.director), f.title)
})

test('the same day gives the same ten, whatever order the catalog arrives in', () => {
  const a = pickDailySet({ films, odds, dayNumber: DAY }).films.map((p) => p.id)
  const b = pickDailySet({ films: [...films].reverse(), odds, dayNumber: DAY }).films.map((p) => p.id)
  assert.equal(a.length, 10)
  assert.deepEqual(a, b)
  assert.notDeepEqual(a, pickDailySet({ films, odds, dayNumber: DAY + 1 }).films.map((p) => p.id))
})

test('ten films a day, no director or franchise twice, at most five in English', () => {
  for (const day of year) {
    const list = day.films.map((p) => byId.get(p.id))
    assert.equal(list.length, 10, `day ${day.day}`)
    const directors = list.map((f) => f.director).filter(Boolean)
    assert.equal(new Set(directors).size, directors.length, `day ${day.day} repeats a director`)
    const families = list.map((f) => f.family).filter(Boolean)
    assert.equal(new Set(families).size, families.length, `day ${day.day} repeats a franchise`)
    assert.ok(list.filter((f) => f.group === 'English').length <= 5, `day ${day.day} too English`)
  }
})

test('mostly films a fan has seen: about seven of ten, never fewer than five and a half', () => {
  const seen = year.map((day) => day.films.reduce((s, p) => s + odds.get(p.id).pSeen, 0))
  const avg = seen.reduce((s, x) => s + x, 0) / seen.length
  assert.ok(avg >= 6.8, `average ${avg}`)
  assert.ok(Math.min(...seen) >= 5.5, `lowest ${Math.min(...seen)}`)
})

test('every day mixes genres, languages and decades', () => {
  for (const day of year) {
    const list = day.films.map((p) => byId.get(p.id))
    assert.ok(new Set(list.map((f) => f.primaryGenre)).size >= 5, `day ${day.day} genres`)
    assert.ok(new Set(list.map((f) => f.language)).size >= 4, `day ${day.day} languages`)
    assert.ok(new Set(list.map((f) => f.decade)).size >= 3, `day ${day.day} decades`)
  }
})

test('one hidden gem and one crowd favourite every day; labels tell the truth', () => {
  for (const day of year) {
    const slots = day.films.map((p) => p.slot)
    assert.equal(slots.filter((s) => s === 'gem').length, 1)
    assert.equal(slots.filter((s) => s === 'crowd').length, 1)
    for (const p of day.films) {
      const f = byId.get(p.id)
      if (p.slot === 'indian') assert.ok(p.label.startsWith(f.language) || p.label.startsWith(f.indian), `${p.label} for ${f.title}`)
      if (p.slot === 'world') assert.equal(p.label, `World cinema: ${f.language}`)
      if (p.slot === 'auteur') assert.equal(p.label, `Director's pick: ${f.director}`)
      if (p.label === 'Art house') assert.ok(f.arthouse, f.title)
    }
  }
})

test('face-off days show one film from each side, side by side', () => {
  const faceOffDays = year.filter((d) => d.faceOff)
  assert.ok(faceOffDays.length >= 10)
  for (const day of faceOffDays) {
    const pair = day.films.filter((p) => p.slot === 'faceA' || p.slot === 'faceB')
    assert.equal(pair.length, 2)
    const spec = FACE_OFFS.find((f) => f.title === day.faceOff)
    const [a, b] = pair.map((p) => byId.get(p.id))
    const on = (f, side) => f.family === side.family || f.director === side.director
    assert.ok(on(a, spec.a) && on(b, spec.b), `${day.faceOff}: ${a.title} vs ${b.title}`)
    assert.equal(day.films.indexOf(pair[1]) - day.films.indexOf(pair[0]), 1)
  }
})

test('films rest before coming back, and duplicates never appear', () => {
  const last = new Map()
  for (const day of year) {
    for (const p of day.films) {
      assert.equal(byId.get(p.id).duplicateOf, null)
      if (last.has(p.id)) assert.ok(day.day - last.get(p.id) >= 14, `${byId.get(p.id).title} back after ${day.day - last.get(p.id)} days`)
      last.set(p.id, day.day)
    }
  }
})

test('community answers move a film between "known" and "hidden"', () => {
  const film = films.find((f) => f.title === 'The Matrix')
  const prior = filmOdds(film, undefined)
  assert.ok(prior.pSeen > 0.9)
  const nobodySaw = filmOdds(film, { likes: 2, dislikes: 0, notSeen: 60 })
  assert.ok(nobodySaw.pSeen < 0.3)
  const loved = filmOdds(film, { likes: 50, dislikes: 2, notSeen: 0 })
  assert.ok(loved.pLove > 0.9)
  // A film everyone loves tells little; one that splits people tells the most.
  assert.ok(informativeness({ pSeen: 0.9, pLove: 0.5 }).opinion > informativeness({ pSeen: 0.9, pLove: 0.95 }).opinion)
  assert.ok(seenPrior(36, 'Malayalam') > seenPrior(36, 'English'))
})

test('Wikidata facts: details for cards, and directors that agree with the hand-written list', async () => {
  const { filmDetails } = await import('../lib/films/filmFeatures.js')
  const godfather = filmDetails({ title: 'The Godfather', year: 1972 })
  assert.equal(godfather.director, 'Francis Ford Coppola')
  assert.ok(godfather.cast.includes('Al Pacino'))
  assert.ok(godfather.runtime > 150 && godfather.runtime < 200)
  assert.deepEqual(filmDetails({ title: 'Not a film', year: 1900 }), { director: null, cast: [], runtime: null })
  const fs = await import('node:fs')
  const w = JSON.parse(fs.readFileSync(new URL('../data/wikidataFacts.json', import.meta.url), 'utf8')).films
  assert.ok(Object.keys(w).length >= 400, 'most catalog films have Wikidata facts')
})
