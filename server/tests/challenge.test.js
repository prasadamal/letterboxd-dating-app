import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL ||= 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key-000000'
process.env.JWT_SECRET ||= 'test-jwt-secret-0000000000'

const { answerSimilarity, scoreChallenge, validateAnswers, verdictFor } = await import('../lib/challenge.js')
const { newCode, normalizeCode, shareText } = await import('../services/challengeService.js')
const { challengePreviewHtml } = await import('../lib/linkPreview.js')

const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const answers = (list) => Object.fromEntries(ids.map((id, i) => [id, list[i]]))
const arif = answers(['love', 'love', 'hate', 'skip', 'love', 'hate', 'love', 'skip', 'love', 'love'])

test('exactly the same answers is 100%, including the films neither has seen', () => {
  const r = scoreChallenge({ filmIds: ids, mine: { ...arif }, theirs: arif })
  assert.equal(r.score, 100)
  assert.equal(r.same, 10)
  assert.equal(r.verdict.title, 'Film soulmates')
})

test('one difference is never 100%; liked vs disliked costs more than seen vs not seen', () => {
  const unseenDiff = scoreChallenge({ filmIds: ids, mine: { ...arif, 1: 'skip' }, theirs: arif })
  const clash = scoreChallenge({ filmIds: ids, mine: { ...arif, 1: 'hate' }, theirs: arif })
  assert.ok(unseenDiff.score < 100 && unseenDiff.score > clash.score)
  assert.equal(unseenDiff.same, 9)
  assert.deepEqual(clash.clashes, [1])
  assert.equal(answerSimilarity('love', 'skip'), 0.5)
  assert.equal(answerSimilarity('love', 'hate'), 0)
})

test('opposite answers on every film is near 0% and gets a kind verdict', () => {
  const flip = { love: 'hate', hate: 'love', skip: 'love' }
  const r = scoreChallenge({ filmIds: ids, mine: Object.fromEntries(ids.map((id) => [id, flip[arif[id]]])), theirs: arif })
  assert.ok(r.score < 25, `${r.score}`)
  assert.equal(r.verdict.title, 'Opposites attract?')
  assert.equal(verdictFor(76).title, 'Same wavelength')
})

test('films that split people count more than films everyone loves', () => {
  const odds = new Map(ids.map((id) => [id, { pSeen: 0.95, pLove: 0.97 }]))
  odds.set(2, { pSeen: 0.8, pLove: 0.5 })
  const missEasy = scoreChallenge({ filmIds: ids, mine: { ...arif, 1: 'hate' }, theirs: arif, odds })
  const missSplit = scoreChallenge({ filmIds: ids, mine: { ...arif, 2: 'hate' }, theirs: arif, odds })
  assert.ok(missSplit.score < missEasy.score)
})

test('suggests what to watch next: a film they loved that you have not seen', () => {
  const r = scoreChallenge({ filmIds: ids, mine: { ...arif, 1: 'skip' }, theirs: arif })
  assert.equal(r.watchNext.forYou, 1)
  assert.ok([4, 8].includes(r.watchNext.together))
})

test('answers must cover every film with a valid answer', () => {
  assert.throws(() => validateAnswers({ 1: 'love' }, ids), /Answer every film/)
  assert.throws(() => validateAnswers({ ...arif, 3: 'meh' }, ids), /Answer every film/)
  assert.deepEqual(Object.keys(validateAnswers(arif, ids)).length, 10)
})

test('codes are 8 easy-to-read characters; bad codes read as not found', () => {
  for (let i = 0; i < 50; i += 1) assert.match(newCode(), /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/)
  assert.equal(normalizeCode(' abcd2345 '), 'ABCD2345')
  assert.throws(() => normalizeCode('ABC'), /not found/)
  assert.throws(() => normalizeCode('ABCDEFG0'), /not found/)
  assert.match(shareText('Arif', 52, 'https://x/c/ABCD2345'), /Daily #52[\s\S]*https:\/\/x\/c\/ABCD2345/)
})

test('link previews carry the challenge title and escape names', () => {
  const shell = '<html><head><meta name="description" content="x" /><title>ReelMates</title></head><body></body></html>'
  const html = challengePreviewHtml(shell, { name: 'Anna <3', number: 52, films: ids }, 'https://x/c/ABCD2345')
  assert.match(html, /<title>Anna &lt;3&#39;s film challenge/)
  assert.match(html, /og:title/)
  assert.equal((html.match(/<title>/g) || []).length, 1)
  assert.equal((html.match(/name="description"/g) || []).length, 1)
})
