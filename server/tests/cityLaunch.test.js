import test from 'node:test'
import assert from 'node:assert/strict'
import { canonicalCity, cityKey, cityProgress, inDatingArea, isOpenedByAdmin, publicCityProgress, sameCity } from '../lib/cityLaunch.js'

test('city names resolve aliases, drop the state and fix all-lower-case typing', () => {
  assert.equal(canonicalCity('Cochin'), 'Kochi')
  assert.equal(canonicalCity(' ernakulam '), 'Kochi')
  assert.equal(canonicalCity('Bangalore, Karnataka'), 'Bengaluru')
  assert.equal(canonicalCity('thiruvananthapuram'), 'Thiruvananthapuram')
  assert.equal(canonicalCity('navi mumbai'), 'Mumbai')
  assert.equal(canonicalCity('new york'), 'New York')
  assert.equal(canonicalCity('São Paulo'), 'São Paulo')
  assert.equal(canonicalCity(''), '')
})

test('one city in one country is one pool', () => {
  assert.equal(cityKey('Cochin', 'India '), 'kochi|india')
  assert.equal(sameCity({ city: 'Kochi', country: 'India' }, { city: 'cochin', country: 'india' }), true)
  assert.equal(sameCity({ city: 'Hyderabad', country: 'India' }, { city: 'Hyderabad', country: 'Pakistan' }), false)
  assert.equal(sameCity({ city: '', country: 'India' }, { city: '', country: 'India' }), false)
})

test('a city opens when both counts reach the target, or by hand', () => {
  const base = { city: 'Kochi', country: 'India', cityTarget: 150, openCities: [] }
  assert.equal(cityProgress({ ...base, femaleCount: 150, maleCount: 149 }).open, false)
  assert.equal(cityProgress({ ...base, femaleCount: 151, maleCount: 150 }).open, true)
  assert.equal(cityProgress({ ...base, femaleCount: 75, maleCount: 0 }).progressPercent, 25)
  assert.equal(cityProgress({ ...base, openCities: ['cochin'] }).open, true)
  assert.equal(isOpenedByAdmin('Kochi', 'India', ['Kochi, India']), true)
  assert.equal(isOpenedByAdmin('Kochi', 'India', ['Kochi, Japan']), false)
  assert.equal(cityProgress({ ...base, city: '', openCities: [''] }).open, false)
})

test('members never see gender counts', () => {
  const view = publicCityProgress(cityProgress({ city: 'Kochi', country: 'India', femaleCount: 10, maleCount: 90, cityTarget: 100 }))
  assert.deepEqual(Object.keys(view).sort(), ['country', 'name', 'open', 'progressPercent', 'target'])
})

test('decks stay in the city unless both people widen to the country', () => {
  const ctx = { openEverywhere: false, openCityKeys: new Set(['kochi|india', 'thiruvananthapuram|india']) }
  const kochi = { city: 'Kochi', country: 'India', discovery_prefs: {} }
  const kochiWide = { ...kochi, discovery_prefs: { area: 'country' } }
  const tvmWide = { city: 'Trivandrum', country: 'India', discovery_prefs: { area: 'country' } }
  const tvmLocal = { ...tvmWide, discovery_prefs: {} }
  const delhiWide = { city: 'Delhi', country: 'India', discovery_prefs: { area: 'country' } }
  assert.equal(inDatingArea(ctx, kochi, { city: 'cochin', country: 'India' }), true)
  assert.equal(inDatingArea(ctx, kochiWide, tvmWide), true)
  assert.equal(inDatingArea(ctx, kochiWide, tvmLocal), false)
  assert.equal(inDatingArea(ctx, kochi, tvmWide), false)
  // Delhi isn't open yet, so it stays out even for people who widened.
  assert.equal(inDatingArea(ctx, kochiWide, delhiWide), false)
  assert.equal(inDatingArea({ ...ctx, openEverywhere: true }, kochiWide, delhiWide), true)
  // Opened everywhere by an admin: people without a city meet within their country.
  assert.equal(inDatingArea({ openEverywhere: true, openCityKeys: new Set() }, { country: 'India' }, kochi), true)
  assert.equal(inDatingArea({ openEverywhere: true, openCityKeys: new Set() }, { country: 'Kenya' }, kochi), false)
})
