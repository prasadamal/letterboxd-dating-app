import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIcebreakers } from '../lib/icebreakers.js'
import { normalizePrompts, publicPrompts } from '../lib/profilePrompts.js'
import { isPlusActive, plusSummary, plusUntilFromRevenueCat } from '../lib/plus.js'

test('icebreakers lead with the strongest shared signal and strip years', () => {
  const ideas = buildIcebreakers({
    sharedLoved: ['Supa Modo (2018)', 'Amélie (2001)'],
    sharedHated: ['Cats (2019)'],
    favorite: { title: 'Kumbalangi Nights (2019)', relation: 'same' }
  })
  assert.equal(ideas.length, 4)
  assert.match(ideas[0], /same all-time favourite.*Kumbalangi Nights\?/)
  assert.match(ideas[1], /We both loved Supa Modo\./)
  assert.ok(ideas.some((i) => i.includes('Cats') && !i.includes('2019')))
})

test('icebreakers speak to the other person about their prompt and a shared personality', () => {
  const ideas = buildIcebreakers({
    prompts: [{ key: 'comfort', answer: 'Paddington 2', question: 'My comfort rewatch' }],
    sharedPersonality: 'Hopeless Romantic'
  })
  assert.equal(ideas[0], "Apparently we're both Hopeless Romantics. Which film made you one?")
  assert.equal(ideas[1], 'Paddington 2 as a comfort rewatch is elite. How many times so far?')
  assert.ok(!ideas.some((i) => /\bmy comfort\b/i.test(i)))
})

test('icebreakers always have generic fallbacks', () => {
  const ideas = buildIcebreakers({})
  assert.equal(ideas.length, 2)
  assert.ok(ideas.every((i) => i.endsWith('?')))
})

test('prompts keep known keys, trim answers, drop duplicates and cap at three', () => {
  const prompts = normalizePrompts([
    { key: 'comfort', answer: '  Paddington   2 ' },
    { key: 'comfort', answer: 'dup' },
    { key: 'nope', answer: 'x' },
    { key: 'overrated', answer: '' },
    { key: 'first_date', answer: 'Before Sunrise' },
    { key: 'cried', answer: 'Up' },
    { key: 'quote', answer: 'too many' }
  ])
  assert.deepEqual(prompts.map((p) => p.key), ['comfort', 'first_date', 'cried'])
  assert.equal(prompts[0].answer, 'Paddington 2')
  assert.equal(publicPrompts(prompts)[1].question, 'My perfect first-date film')
})

test('Plus is active only while plus_until is in the future', () => {
  const now = Date.parse('2026-10-05T00:00:00Z')
  assert.equal(isPlusActive({ plus_until: '2026-11-01T00:00:00Z' }, now), true)
  assert.equal(isPlusActive({ plus_until: '2026-10-01T00:00:00Z' }, now), false)
  assert.equal(isPlusActive({}, now), false)
  assert.deepEqual(plusSummary({ plus_until: '2026-10-01T00:00:00Z' }, now), { active: false, until: null })
})

test('RevenueCat events map to plus_until', () => {
  assert.equal(plusUntilFromRevenueCat({ type: 'INITIAL_PURCHASE', expiration_at_ms: 1793491200000 }), new Date(1793491200000).toISOString())
  assert.equal(plusUntilFromRevenueCat({ type: 'NON_RENEWING_PURCHASE' }), '9999-12-31T00:00:00.000Z')
  assert.equal(plusUntilFromRevenueCat({ type: 'EXPIRATION' }), null)
  assert.equal(plusUntilFromRevenueCat({ type: 'CANCELLATION' }), undefined)
  assert.equal(plusUntilFromRevenueCat(null), undefined)
})
