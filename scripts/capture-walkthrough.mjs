import { chromium } from 'playwright'
import { mkdirSync, copyFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const artifacts = '/opt/cursor/artifacts'
const shots = join(artifacts, 'screenshots')
const tmpVideo = '/tmp/reelmates_full_flow.webm'
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: '/tmp', size: { width: 1280, height: 800 } }
})
const page = await context.newPage()

async function pause(ms = 1400) {
  await page.waitForTimeout(ms)
}

await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 })
await pause(1200)

await page.locator('input[type="email"]').fill('maya@example.com')
await page.locator('input[type="password"]').fill('123456')
await pause(600)
await page.getByRole('button', { name: /login to your profile/i }).click()
await page.waitForSelector('.app-shell', { timeout: 60000 })
await pause(2000)

await page.getByRole('button', { name: /^discover$/i }).click()
await pause(1200)
const like = page.getByRole('button', { name: /^like$/i }).first()
if (await like.count()) {
  await like.click()
  await pause(1200)
}

await page.getByRole('button', { name: /^matches$/i }).click()
await pause(2000)

const message = page.getByRole('button', { name: /^message$/i }).first()
if (await message.count()) {
  await message.click()
  await pause(1000)
  await page.locator('input[placeholder*="hello" i]').fill('Hey! Same taste in films?')
  await pause(500)
  await page.getByRole('button', { name: /^send$/i }).click()
  await pause(1500)
  await page.getByRole('button', { name: /^close$/i }).click()
  await pause(800)
}

await page.getByRole('button', { name: /^profile$/i }).click()
await pause(2000)
await page.screenshot({ path: join(shots, 'reelmates_05_profile.png'), fullPage: true })

await page.getByRole('button', { name: /^discover$/i }).click()
await pause(1200)

const video = page.video()
if (video) await video.saveAs(tmpVideo)
await context.close()
await browser.close()

execSync(
  `ffmpeg -y -i "${tmpVideo}" -c:v libx264 -pix_fmt yuv420p "${join(artifacts, 'reelmates_full_flow_demo.mp4')}"`,
  { stdio: 'ignore' }
)
copyFileSync(tmpVideo, join(artifacts, 'reelmates_full_flow_demo.webm'))
console.log('saved')
