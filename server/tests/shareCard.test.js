import test from 'node:test'
import assert from 'node:assert/strict'
import { renderPng, tasteCardSvg, tastePreview, withPreviewTags, wrapText } from '../services/shareCardService.js'

const card = {
  name: 'Maya',
  code: 'REEL52782C',
  liked: 12,
  bestStreak: 3,
  personality: { name: 'Hopeless Romantic', emoji: '💘', tagline: 'Here for the yearning.', colors: ['#FF4F9A', '#FF9A6B'] },
  rarestFilms: [{ id: 1, title: 'Up & <Down>', year: 1995, genres: ['Romance'] }]
}

test('long names wrap and overflow ends with an ellipsis', () => {
  assert.deepEqual(wrapText('Midnight Thrill-Seeker', 84, 620, 2), ['Midnight', 'Thrill-Seeker'])
  const lines = wrapText('one two three four five six seven eight nine ten eleven twelve', 28, 200, 2)
  assert.equal(lines.length, 2)
  assert.ok(lines[1].endsWith('…'))
})

test('the preview image escapes member text and renders a PNG', () => {
  const svg = tasteCardSvg(card)
  assert.ok(svg.includes('Up &amp; &lt;Down&gt;'))
  assert.ok(!svg.includes('<Down>'))
  const png = renderPng(svg)
  assert.deepEqual([...png.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47])
})

test('shared taste links get Open Graph tags and keep one set of them', () => {
  const html = '<html><head><title>ReelMates</title><meta property="og:title" content="old" /><meta name="twitter:card" content="x" /></head><body></body></html>'
  const out = withPreviewTags(html, tastePreview(card, 'https://reelmates.example'))
  assert.ok(out.includes('<title>Maya is a Hopeless Romantic 💘 · ReelMates</title>'))
  assert.ok(out.includes('content="https://reelmates.example/api/v1/public/taste/REEL52782C/card.png"'))
  assert.equal((out.match(/property="og:title"/g) || []).length, 1)
  assert.equal((out.match(/name="twitter:card"/g) || []).length, 1)
})
