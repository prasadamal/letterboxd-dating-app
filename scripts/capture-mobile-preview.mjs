import { chromium, devices } from 'playwright'
import { mkdirSync, copyFileSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const artifacts = '/opt/cursor/artifacts'
mkdirSync(artifacts, { recursive: true })

async function record(label, device) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...device,
    recordVideo: { dir: artifacts, size: device.viewport }
  })
  const page = await context.newPage()
  const pause = (ms) => page.waitForTimeout(ms)

  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await pause(1500)
  await page.getByText('Login', { exact: true }).first().click()
  await pause(500)
  await page.locator('input[placeholder="Email"]').fill('maya@example.com')
  await page.locator('input[placeholder="Password"]').fill('123456')
  await page.getByRole('button', { name: 'Login' }).last().click()
  await pause(2500)

  await page.getByText('Launch', { exact: true }).click().catch(() => null)
  await pause(1500)
  await page.getByText('Daily game', { exact: true }).click().catch(() => null)
  await pause(1500)
  await page.getByText('Profile', { exact: true }).click().catch(() => null)
  await pause(1200)

  const video = page.video()
  await context.close()
  await browser.close()
  const src = await video.path()
  return { label, src }
}

const android = await record('android', devices['Pixel 7'])
const ios = await record('ios', devices['iPhone 14'])

for (const { label, src } of [android, ios]) {
  const webm = join(artifacts, `reelmates_mobile_${label}_preview.webm`)
  copyFileSync(src, webm)
  execSync(
    `ffmpeg -y -i "${webm}" -c:v libx264 -pix_fmt yuv420p "${join(artifacts, `reelmates_mobile_${label}_preview.mp4`)}"`,
    { stdio: 'ignore' }
  )
  console.log('saved', label)
}
