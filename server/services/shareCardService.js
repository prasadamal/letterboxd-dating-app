import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

// Link-preview images (Open Graph, 1200×630) for shared taste cards, drawn as SVG and rendered to PNG with the
// app's display font. No emoji: the renderer has no colour-emoji font.
const FONT_FILES = ['BricolageGrotesque_800ExtraBold.ttf', 'BricolageGrotesque_700Bold.ttf'].map((file) =>
  fileURLToPath(new URL(`../assets/fonts/${file}`, import.meta.url))
)
const FONT = 'Bricolage Grotesque'
const NEUTRAL = ['#2A2A35', '#55556B']

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

// Greedy word wrap by an estimated glyph width (Bricolage averages ~0.56em).
export function wrapText(text, fontSize, maxWidth, maxLines = 2) {
  const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * 0.56)))
  const lines = []
  let line = ''
  for (const word of String(text || '').split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (next.length <= maxChars || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s.,;:!?-]+$/, '')}…`
    return kept
  }
  return lines
}

function textLines(lines, { x, y, size, lineHeight, weight = 800, fill = '#fff', opacity = 1 }) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * lineHeight}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${opacity}">${esc(line)}</text>`
    )
    .join('')
}

// The card behind /taste/<code> link previews: personality on the left, their rarest loves on the right.
export function tasteCardSvg(card, { host = 'reelmates.app' } = {}) {
  const persona = card.personality
  const [from, to] = persona?.colors || NEUTRAL
  const name = persona ? persona.name : `${card.name}’s film taste`
  const nameSize = name.length > 18 ? 68 : 84
  const nameLines = wrapText(name, nameSize, 620, 2)
  // Without a personality there is no "Maya is a" line, so the name moves up.
  const nameStart = persona ? 248 : 204
  const taglineStart = nameStart + nameLines.length * nameSize * 0.98 + 40
  const taglineLines = Math.max(0, Math.min(2, Math.floor((500 - taglineStart) / 36) + 1))
  const tagline = wrapText(persona?.tagline || 'Swipe today’s 10 films and find your film people.', 28, 620, taglineLines)
  const films = (card.rarestFilms || []).slice(0, 3)

  const filmRows = films
    .map((film, i) => {
      const y = 210 + i * 86
      const title = wrapText(film.title, 30, 300, 1)[0]
      return `<text x="808" y="${y}" font-family="${FONT}" font-size="30" font-weight="800" fill="#fff">${esc(title)}</text>
      <text x="808" y="${y + 30}" font-family="${FONT}" font-size="20" font-weight="700" fill="#fff" fill-opacity="0.6">${esc([film.year, film.genres?.[0]].filter(Boolean).join(' · '))}</text>`
    })
    .join('')
  const stats = [`${card.liked ?? 0} loved`, card.bestStreak > 1 ? `best streak ${card.bestStreak}` : null].filter(Boolean).join('  ·  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${esc(from)}"/><stop offset="1" stop-color="${esc(to)}"/></linearGradient>
    <radialGradient id="shine" cx="0.12" cy="0" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#shine)"/>
  <rect x="64" y="56" width="44" height="44" rx="12" fill="#D4FF3F"/>
  <text x="86" y="89" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="800" fill="#0A0A0D">R</text>
  <text x="122" y="89" font-family="${FONT}" font-size="28" font-weight="800" fill="#fff">ReelMates</text>
  <text x="64" y="176" font-family="${FONT}" font-size="20" font-weight="700" fill="#fff" fill-opacity="0.85" letter-spacing="3">${persona ? 'FILM PERSONALITY' : 'FILM TASTE'}</text>
  ${persona ? textLines([`${card.name} is a`], { x: 64, y: 220, size: 32, lineHeight: 36, weight: 700, opacity: 0.92 }) : ''}
  ${textLines(nameLines, { x: 64, y: nameStart + nameSize * 0.82, size: nameSize, lineHeight: nameSize * 0.98 })}
  ${textLines(taglineLines ? tagline : [], { x: 64, y: taglineStart, size: 28, lineHeight: 36, weight: 700, opacity: 0.92 })}
  <rect x="64" y="526" width="660" height="60" rx="30" fill="#D4FF3F"/>
  <text x="94" y="565" font-family="${FONT}" font-size="24" font-weight="800" fill="#0A0A0D">${esc(`How well does your taste match?  ${host}`)}</text>
  <rect x="776" y="56" width="360" height="530" rx="32" fill="#08080B" fill-opacity="0.55"/>
  <text x="808" y="120" font-family="${FONT}" font-size="20" font-weight="700" fill="#D4FF3F" letter-spacing="3">${films.length ? 'RAREST LOVES' : 'FILM TASTE'}</text>
  ${filmRows || `<text x="808" y="210" font-family="${FONT}" font-size="30" font-weight="800" fill="#fff">Just getting started</text>`}
  <text x="808" y="548" font-family="${FONT}" font-size="22" font-weight="700" fill="#fff" fill-opacity="0.75">${esc(stats)}</text>
</svg>`
}

export function renderSvg(svg, width) {
  const resvg = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT },
    fitTo: { mode: 'width', value: width }
  })
  return resvg.render().asPng()
}

export function renderPng(svg) {
  return renderSvg(svg, 1200)
}

// Adds Open Graph / Twitter tags to the web app's index.html so shared links unfurl with a title, text and image.
export function withPreviewTags(html, { title, description, image, url }) {
  const tags = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="ReelMates" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`
  ].join('\n    ')
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · ReelMates</title>`)
    .replace(/\s*<meta property="og:[^>]*>/g, '')
    .replace(/\s*<meta name="twitter:[^>]*>/g, '')
    .replace('</head>', `    ${tags}\n  </head>`)
}

export function tastePreview(card, origin) {
  const persona = card.personality
  const title = persona ? `${card.name} is a ${persona.name} ${persona.emoji}` : `${card.name}’s film taste`
  const description = `${persona?.tagline ? `${persona.tagline} ` : ''}How well does your film taste match? Swipe today’s 10 films on ReelMates.`
  return {
    title,
    description,
    image: `${origin}/api/v1/public/taste/${encodeURIComponent(card.code)}/card.png`,
    url: `${origin}/taste/${encodeURIComponent(card.code)}`
  }
}

export function readIndexHtml(distPath) {
  return readFileSync(`${distPath}/index.html`, 'utf8')
}
