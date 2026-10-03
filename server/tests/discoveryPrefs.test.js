import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDiscoveryPrefs, passesDiscoveryFilters } from '../services/discoveryPrefs.js'

test('normalizeDiscoveryPrefs swaps inverted age bounds', () => {
  const prefs = normalizeDiscoveryPrefs({ minAge: 40, maxAge: 25 })
  assert.equal(prefs.minAge, 25)
  assert.equal(prefs.maxAge, 40)
})

test('passesDiscoveryFilters respects age and country', () => {
  const prefs = { minAge: 25, maxAge: 35, countries: ['Canada', 'USA'] }
  assert.equal(passesDiscoveryFilters({ age: 30, country: 'Canada' }, prefs), true)
  assert.equal(passesDiscoveryFilters({ age: 22, country: 'Canada' }, prefs), false)
  assert.equal(passesDiscoveryFilters({ age: 30, country: 'France' }, prefs), false)
})
