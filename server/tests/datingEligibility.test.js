import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultInterestedIn, genderQueryValues, isMutualInterest, normalizeInterestedIn } from '../lib/datingEligibility.js'

test('defaults keep the old behaviour for men and women and show everyone to non-binary people', () => {
  assert.deepEqual(defaultInterestedIn('male'), ['female'])
  assert.deepEqual(defaultInterestedIn('female'), ['male'])
  assert.deepEqual(defaultInterestedIn('nonbinary'), ['male', 'female', 'nonbinary'])
  assert.deepEqual(defaultInterestedIn('other'), ['male', 'female', 'nonbinary'])
})

test('interest is normalized, deduplicated and ordered; empty falls back to the default', () => {
  assert.deepEqual(normalizeInterestedIn(['nonbinary', 'female', 'female', 'bogus'], 'male'), ['female', 'nonbinary'])
  assert.deepEqual(normalizeInterestedIn([], 'female'), ['male'])
  assert.deepEqual(normalizeInterestedIn(null, 'male'), ['female'])
  assert.deepEqual(normalizeInterestedIn(['other'], 'male'), ['nonbinary'])
})

test('matching needs interest both ways', () => {
  const man = { gender: 'male', interested_in: ['female'] }
  const woman = { gender: 'female', interested_in: ['male'] }
  const womanIntoWomen = { gender: 'female', interested_in: ['female'] }
  const gayMan = { gender: 'male', interested_in: ['male'] }
  const enby = { gender: 'nonbinary', interested_in: ['female', 'nonbinary'] }

  assert.equal(isMutualInterest(man, woman), true)
  assert.equal(isMutualInterest(man, womanIntoWomen), false)
  assert.equal(isMutualInterest(womanIntoWomen, { gender: 'female', interested_in: ['female', 'male'] }), true)
  assert.equal(isMutualInterest(gayMan, { gender: 'male', interested_in: ['male'] }), true)
  assert.equal(isMutualInterest(gayMan, woman), false)
  assert.equal(isMutualInterest(enby, womanIntoWomen), false)
  assert.equal(isMutualInterest(enby, { gender: 'female', interested_in: ['nonbinary'] }), true)
  // Legacy rows with no interested_in behave as before.
  assert.equal(isMutualInterest({ gender: 'male' }, { gender: 'female' }), true)
  assert.equal(isMutualInterest({ gender: 'male' }, { gender: 'male' }), false)
})

test('deck query includes the legacy "other" value when non-binary people are wanted', () => {
  assert.deepEqual(genderQueryValues({ gender: 'male', interested_in: ['female'] }), ['female'])
  assert.deepEqual(genderQueryValues({ gender: 'female', interested_in: ['nonbinary'] }), ['nonbinary', 'other'])
})
