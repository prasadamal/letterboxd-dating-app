// Offline check of the match formula: does it find people whose taste really is alike?
//
// Builds a world of simulated film fans in six taste groups (each group leans towards some genres,
// languages, eras and styles; each fan is their group plus personal noise). Fans play the real daily
// ten for N days, answering liked / didn't like / haven't seen from their own taste, and log stars in a
// diary for some films. Then each formula ranks everyone for everyone, and we measure:
//   AUC          chance a same-group pair scores above a different-group pair (0.5 = coin flip)
//   top-5        share of each fan's five best matches who are really in their group
//   correlation  Spearman rank correlation between the score and true taste similarity
//
//   node server/scripts/evaluateMatching.js [days ...]     default: 3 7 14 30
import { movieCatalog } from '../movieCatalog.js'
import { enrichFilm, featureTokens } from '../lib/films/filmFeatures.js'
import { filmOdds, oddsByFilm, seenPrior, lovePrior } from '../lib/films/filmStats.js'
import { pickDailySet, seededRandom } from '../lib/films/dailyPicker.js'
import { compareTaste } from '../lib/tasteMatch.js'
import { compareTaste as compareV1 } from './lib/tasteMatchV1.js'

const GROUPS = 6
const PER_GROUP = 60
const PLAY_RATE = 0.7
const DIARY_RATE = 0.3
const START_DAY = 20800

function gaussian(rng) {
  const u = Math.max(rng(), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}
const logistic = (x) => 1 / (1 + Math.exp(-x))
const logit = (p) => Math.log(p / (1 - p))

export function buildWorld(seed = 'eval') {
  const rng = seededRandom(seed)
  const films = movieCatalog.map(enrichFilm)
  const tokens = [...new Set(films.flatMap((f) => featureTokens(f)))]
  const filmTokens = new Map(films.map((f) => [f.id, featureTokens(f)]))
  const groupVectors = Array.from({ length: GROUPS }, () => new Map(tokens.map((t) => [t, gaussian(rng) * 0.9])))
  const people = []
  for (let g = 0; g < GROUPS; g += 1) {
    for (let i = 0; i < PER_GROUP; i += 1) {
      const v = new Map(tokens.map((t) => [t, groupVectors[g].get(t) + gaussian(rng) * 0.6]))
      people.push({ id: `${g}-${i}`, group: g, taste: v, rng: seededRandom(`${seed}:${g}:${i}`) })
    }
  }
  return { films, filmTokens, people, tokens }
}

function affinity(person, filmTokenList) {
  let s = 0
  for (const t of filmTokenList) s += person.taste.get(t) || 0
  return s / Math.sqrt(filmTokenList.length)
}

function langAffinity(person, film) {
  const t = `l:${film.group === 'Indian' ? film.indian : film.group}`
  return person.taste.get(t) || 0
}

export function playDays(world, days) {
  const { films, filmTokens, people } = world
  const byId = new Map(films.map((f) => [f.id, f]))
  for (const p of people) Object.assign(p, { love: new Set(), hate: new Set(), skip: new Set(), stars: new Map(), films: new Map(), titles: new Map() })
  const counts = new Map()
  const history = []
  const odds = oddsByFilm(films, new Map())
  for (let d = START_DAY; d < START_DAY + days; d += 1) {
    const ids = pickDailySet({ films, odds, dayNumber: d, history }).films.map((x) => x.id)
    history.push({ dayNumber: d, ids })
    for (const p of people) {
      if (p.rng() > PLAY_RATE) continue
      for (const id of ids) {
        const f = byId.get(id)
        const seen = p.rng() < logistic(logit(seenPrior(f.popularity, f.language)) + 0.8 * langAffinity(p, f))
        const c = counts.get(id) || { likes: 0, dislikes: 0, notSeen: 0 }
        p.films.set(id, f)
        p.titles.set(id, f.title)
        if (!seen) {
          p.skip.add(id)
          c.notSeen += 1
        } else {
          const pLove = logistic(logit(lovePrior(f)) + 1.6 * affinity(p, filmTokens.get(id)))
          const loved = p.rng() < pLove
          ;(loved ? p.love : p.hate).add(id)
          loved ? (c.likes += 1) : (c.dislikes += 1)
          if (p.rng() < DIARY_RATE) p.stars.set(id, Math.max(1, Math.min(10, Math.round(1 + 9 * pLove + gaussian(p.rng)))))
        }
        counts.set(id, c)
      }
    }
  }
  return new Map(films.map((f) => [f.id, filmOdds(f, counts.get(f.id))]))
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (const [t, va] of a) { const vb = b.get(t) || 0; dot += va * vb; na += va * va; nb += vb * vb }
  return dot / Math.sqrt(na * nb)
}

function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0])
  const r = new Array(values.length)
  for (let i = 0; i < order.length; i += 1) r[order[i][1]] = i
  return r
}
function spearman(x, y) {
  const rx = ranks(x), ry = ranks(y)
  const n = x.length
  const mean = (n - 1) / 2
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i += 1) { num += (rx[i] - mean) * (ry[i] - mean); dx += (rx[i] - mean) ** 2; dy += (ry[i] - mean) ** 2 }
  return num / Math.sqrt(dx * dy)
}

export function evaluate(world, odds, formula) {
  const { people } = world
  const scores = []
  const truth = []
  const same = []
  let top5hits = 0
  let top5total = 0
  for (let i = 0; i < people.length; i += 1) {
    const mine = []
    for (let j = 0; j < people.length; j += 1) {
      if (i === j) continue
      const r = formula(people[i], people[j], odds)
      mine.push({ j, s: r.score + (r.evidence || r.sharedCount || 0) * 1e-4 })
      if (j > i) {
        scores.push(r.score)
        truth.push(cosine(people[i].taste, people[j].taste))
        same.push(people[i].group === people[j].group)
      }
    }
    mine.sort((x, y) => y.s - x.s)
    for (const m of mine.slice(0, 5)) top5hits += people[m.j].group === people[i].group ? 1 : 0
    top5total += 5
  }
  // AUC via ranks (Mann–Whitney), ties counted half.
  const r = ranks(scores.map((s, k) => s + k * 1e-9))
  let pos = 0, sumPos = 0
  for (let k = 0; k < scores.length; k += 1) if (same[k]) { pos += 1; sumPos += r[k] }
  const neg = scores.length - pos
  const auc = (sumPos - (pos * (pos - 1)) / 2) / (pos * neg)
  return { auc, top5: top5hits / top5total, rho: spearman(scores, truth) }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const daysList = process.argv.slice(2).map(Number).filter(Boolean)
  const world = buildWorld()
  const fmt = (x) => x.toFixed(3)
  console.log('days | formula | AUC   | top-5 | correlation')
  for (const days of daysList.length ? daysList : [3, 7, 14, 30]) {
    const odds = playDays(world, days)
    const v1 = evaluate(world, odds, (a, b) => compareV1(a, b))
    const v2 = evaluate(world, odds, (a, b, o) => compareTaste(a, b, { odds: o }))
    console.log(`${String(days).padStart(4)} | before  | ${fmt(v1.auc)} | ${fmt(v1.top5)} | ${fmt(v1.rho)}`)
    console.log(`${String(days).padStart(4)} | now     | ${fmt(v2.auc)} | ${fmt(v2.top5)} | ${fmt(v2.rho)}`)
  }
  console.log(`(${GROUPS * PER_GROUP} simulated fans in ${GROUPS} taste groups; chance level: AUC 0.5, top-5 ${(1 / GROUPS).toFixed(3)})`)
}
