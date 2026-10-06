import test from 'node:test'
import assert from 'node:assert/strict'
import { countryProgress, ilikeExact, isOpenedByAdmin, sameCountry } from '../lib/regionLaunch.js'

test('country names compare case- and space-insensitively', () => {
  assert.equal(sameCountry(' India ', 'india'), true)
  assert.equal(sameCountry('United  Kingdom', 'united kingdom'), true)
  assert.equal(sameCountry('', ''), false)
  assert.equal(sameCountry('India', 'Indonesia'), false)
})

test('a country opens when both counts reach the target', () => {
  const base = { country: 'India', countryTarget: 100, openCountries: [] }
  assert.equal(countryProgress({ ...base, maleCount: 100, femaleCount: 99 }).open, false)
  const open = countryProgress({ ...base, maleCount: 120, femaleCount: 100 })
  assert.equal(open.open, true)
  assert.equal(open.progressPercent, 100)
  assert.equal(countryProgress({ ...base, maleCount: 50, femaleCount: 0 }).progressPercent, 25)
})

test('an admin can open a country by hand', () => {
  assert.equal(isOpenedByAdmin('kenya', ['Kenya']), true)
  const progress = countryProgress({ country: 'Kenya', maleCount: 1, femaleCount: 1, countryTarget: 150, openCountries: ['KENYA'] })
  assert.equal(progress.open, true)
  assert.equal(progress.openedByAdmin, true)
  assert.equal(countryProgress({ country: '', maleCount: 999, femaleCount: 999, countryTarget: 1 }).open, false)
})

test('ilike patterns escape wildcards', () => {
  assert.equal(ilikeExact(' 100%_land '), '100\\%\\_land')
})
