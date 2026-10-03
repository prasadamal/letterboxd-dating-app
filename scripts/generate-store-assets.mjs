#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const outDir = path.join(process.cwd(), 'docs/store/assets')
fs.mkdirSync(outDir, { recursive: true })

const featureGraphic = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1016"/>
      <stop offset="100%" stop-color="#1a1424"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#g)"/>
  <text x="80" y="180" fill="#f4a261" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">REELMATES</text>
  <text x="80" y="250" fill="#edf5ff" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="800">Match through movie taste</text>
  <text x="80" y="310" fill="#b0bfce" font-family="Inter, Arial, sans-serif" font-size="26">Daily film game · Launch gate · Cinematic dating</text>
  <circle cx="880" cy="250" r="120" fill="#ff6993" opacity="0.25"/>
  <circle cx="920" cy="200" r="80" fill="#ad7cff" opacity="0.35"/>
</svg>
`

fs.writeFileSync(path.join(outDir, 'feature-graphic-template.svg'), featureGraphic)
console.log('Wrote docs/store/assets/feature-graphic-template.svg')
console.log('Export to 1024x500 PNG for Play Console feature graphic.')
