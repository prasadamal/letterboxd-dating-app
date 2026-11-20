const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const mod = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/diaryFormat.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: mod, Date, Set, Math, String, Number })
const { localDay, shiftDay, dayLabel, weekdayShort, groupByMonth, diaryStats, tapStar, starsText, starsSpoken } = mod

const entry = (id, watchedOn, filmId, stars = null) => ({ id, watchedOn, stars, note: null, rewatch: false, loggedAt: '', film: { id: filmId, title: `Film ${filmId}` } })

test('days are the phone’s own calendar days and move across month and year ends', () => {
  const today = new Date(2026, 10, 20, 23, 30)
  assert.equal(localDay(today), '2026-11-20')
  assert.equal(localDay(today, -1), '2026-11-19')
  assert.equal(shiftDay('2026-03-01', -1), '2026-02-28')
  assert.equal(shiftDay('2024-03-01', -1), '2024-02-29')
  assert.equal(shiftDay('2026-12-31', 1), '2027-01-01')
  assert.equal(dayLabel('2026-11-20', today), 'Today')
  assert.equal(dayLabel('2026-11-19', today), 'Yesterday')
  assert.equal(dayLabel('2026-11-03', today), 'Tue 3 Nov')
  assert.equal(dayLabel('2025-11-03', today), 'Mon 3 Nov 2025')
  assert.equal(weekdayShort('2026-11-20'), 'Fri')
})

test('entries group by month, newest first, and stats count the right things', () => {
  const entries = [entry('a', '2026-11-18', 1, 9), entry('b', '2026-11-02', 2), entry('c', '2026-10-30', 1, 6), entry('d', '2025-12-31', 3, 10)]
  const groups = groupByMonth(entries)
  assert.deepEqual(JSON.parse(JSON.stringify(groups.map((g) => [g.title, g.entries.length]))), [['November 2026', 2], ['October 2026', 1], ['December 2025', 1]])
  assert.deepEqual(
    { ...diaryStats(entries, new Date(2026, 10, 20)) },
    { thisYear: 3, thisMonth: 2, films: 3, average: 4.2 }
  )
  assert.deepEqual({ ...diaryStats([], new Date(2026, 10, 20)) }, { thisYear: 0, thisMonth: 0, films: 0, average: null })
})

test('star taps go full, then half, then clear', () => {
  assert.equal(tapStar(null, 4), 8)
  assert.equal(tapStar(8, 4), 7)
  assert.equal(tapStar(7, 4), null)
  assert.equal(tapStar(7, 2), 4)
  assert.equal(starsText(7), '★★★½')
  assert.equal(starsText(10), '★★★★★')
  assert.equal(starsText(1), '½')
  assert.equal(starsText(null), '')
  assert.equal(starsSpoken(7), '3.5 stars')
  assert.equal(starsSpoken(2), '1 star')
  assert.equal(starsSpoken(null), 'No rating')
})
