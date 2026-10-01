/**
 * Verifies follow mode: captures two frames a few seconds apart for each planet
 * while following it, so any drift away from the frame centre is visible.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180'
const OUT = 'C:/Users/xzf/AppData/Local/Temp/opencode/follow-shots'
const BODIES = { mercury: '1', earth: '3', mars: '4', jupiter: '5', neptune: '8' }

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } })
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await mkdir(OUT, { recursive: true })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas', { state: 'attached' })
await page.waitForFunction(() => !document.body.innerText.includes('Preparing the Solar System'), { timeout: 90_000 })
await page.waitForTimeout(2000)
await page.keyboard.press('Escape')
await page.waitForTimeout(1500)

// Close the side panel so the planet is not hidden behind it.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'View Solar System')
  btn?.click()
})
await page.waitForTimeout(2500)

for (const [name, key] of Object.entries(BODIES)) {
  await page.keyboard.press(key)
  await page.waitForTimeout(4000)
  await page.keyboard.press('f')
  await page.waitForTimeout(7000)
  await page.screenshot({ path: `${OUT}/${name}-a.png` })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: `${OUT}/${name}-b.png` })
  await page.keyboard.press('h')
  await page.waitForTimeout(3500)
  console.log(`captured ${name}`)
}

await browser.close()
