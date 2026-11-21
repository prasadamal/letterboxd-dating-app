// Runs the daily picker for a year on the real catalog and reports how well the rules hold.
//   node server/scripts/simulateDaily.js [days] [--show N]
import { movieCatalog } from '../movieCatalog.js'
import { enrichFilm } from '../lib/films/filmFeatures.js'
import { oddsByFilm } from '../lib/films/filmStats.js'
import { pickDailySet } from '../lib/films/dailyPicker.js'

const days = Number(process.argv[2]) || 365
const showIndex = process.argv.indexOf('--show')
const show = showIndex > 0 ? Number(process.argv[showIndex + 1]) || 3 : 0

export function simulate(daysToRun, startDay = 20800) {
  const films = movieCatalog.map(enrichFilm)
  const byId = new Map(films.map((f) => [f.id, f]))
  const odds = oddsByFilm(films, new Map())
  const history = []
  const report = { days: daysToRun, problems: [], seenExpected: [], gemsPerDay: [], englishMax: 0, minGapDays: Infinity, distinct: new Set(), slotCounts: {}, faceOffs: 0, sample: [] }
  const lastDay = new Map()
  for (let d = startDay; d < startDay + daysToRun; d += 1) {
    const { films: picks, faceOff } = pickDailySet({ films, odds, dayNumber: d, history })
    const ids = picks.map((p) => p.id)
    const list = ids.map((id) => byId.get(id))
    if (picks.length !== 10) report.problems.push(`day ${d}: ${picks.length} films`)
    const directors = list.map((f) => f.director).filter(Boolean)
    if (new Set(directors).size !== directors.length) report.problems.push(`day ${d}: director repeated`)
    const families = list.map((f) => f.family).filter(Boolean)
    if (new Set(families).size !== families.length) report.problems.push(`day ${d}: family repeated`)
    const english = list.filter((f) => f.group === 'English').length
    report.englishMax = Math.max(report.englishMax, english)
    const seen = list.reduce((s, f) => s + odds.get(f.id).pSeen, 0)
    report.seenExpected.push(seen)
    report.gemsPerDay.push(list.filter((f) => odds.get(f.id).pSeen < 0.38).length)
    for (const p of picks) report.slotCounts[p.slot] = (report.slotCounts[p.slot] || 0) + 1
    if (faceOff) report.faceOffs += 1
    for (const id of ids) {
      if (lastDay.has(id)) report.minGapDays = Math.min(report.minGapDays, d - lastDay.get(id))
      lastDay.set(id, d)
      report.distinct.add(id)
    }
    report.genresPerDay = (report.genresPerDay || []).concat(new Set(list.map((f) => f.primaryGenre)).size)
    report.languagesPerDay = (report.languagesPerDay || []).concat(new Set(list.map((f) => f.language)).size)
    report.decadesPerDay = (report.decadesPerDay || []).concat(new Set(list.map((f) => f.decade)).size)
    if (report.sample.length < 7) report.sample.push({ day: d, faceOff, picks: picks.map((p, i) => `${p.label.padEnd(34)} ${list[i].title} (${list[i].year}, ${list[i].language})`) })
    history.push({ dayNumber: d, ids })
  }
  return report
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = simulate(days)
  const avg = (a) => (a.reduce((s, x) => s + x, 0) / a.length).toFixed(2)
  const min = (a) => Math.min(...a).toFixed(2)
  console.log(`Days simulated: ${r.days}`)
  console.log(`Rule breaks: ${r.problems.length}${r.problems.length ? ' → ' + r.problems.slice(0, 5).join('; ') : ''}`)
  console.log(`Films a fan has likely seen per day: avg ${avg(r.seenExpected)}, lowest ${min(r.seenExpected)} (of 10)`)
  console.log(`Rarely-seen films per day: avg ${avg(r.gemsPerDay)}, most ${Math.max(...r.gemsPerDay)}`)
  console.log(`Different genres per day: avg ${avg(r.genresPerDay)}, lowest ${Math.min(...r.genresPerDay)}`)
  console.log(`Different languages per day: avg ${avg(r.languagesPerDay)}, lowest ${Math.min(...r.languagesPerDay)}`)
  console.log(`Different decades per day: avg ${avg(r.decadesPerDay)}, lowest ${Math.min(...r.decadesPerDay)}`)
  console.log(`Most English films in a day: ${r.englishMax}`)
  console.log(`Shortest gap before a film came back: ${r.minGapDays} days; films used: ${r.distinct.size}`)
  console.log(`Face-off days: ${r.faceOffs}`)
  console.log('Slots filled:', JSON.stringify(r.slotCounts))
  for (const s of r.sample.slice(0, show)) {
    console.log(`\nDay ${s.day}${s.faceOff ? ` — face-off: ${s.faceOff}` : ''}`)
    for (const line of s.picks) console.log('  ' + line)
  }
}
