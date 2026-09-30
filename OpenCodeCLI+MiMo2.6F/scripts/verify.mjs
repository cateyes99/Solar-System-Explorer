/* Headless smoke test: boots the app, exercises the main UI paths,
 * captures screenshots and reports any console/page errors. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:5174/'
const OUT = 'verify-shots'
mkdirSync(OUT, { recursive: true })

const logs = []
const problems = []

const browser = await chromium.launch({
  args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--use-gl=angle'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

page.on('console', (message) => {
  const line = `${message.type()}: ${message.text()}`
  logs.push(line)
  if (message.type() === 'error') problems.push(line)
})
page.on('pageerror', (error) => problems.push(`PAGEERROR: ${error.message}`))

await page.goto(BASE, { waitUntil: 'load' })
await page.waitForTimeout(9000)

// Dismiss the welcome overlay so the system view can be judged cleanly
await page.evaluate(() => {
  const button = Array.from(document.querySelectorAll('button')).find((el) =>
    /Begin exploring/i.test(el.textContent ?? ''),
  )
  button?.click()
})
await page.waitForTimeout(900)

const info = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  let webgl = false
  try {
    const probe = document.createElement('canvas')
    webgl = Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'))
  } catch {
    webgl = false
  }
  return {
    title: document.title,
    canvas: Boolean(canvas),
    canvasSize: canvas ? [canvas.width, canvas.height] : null,
    webgl,
    loadingVisible: Boolean(document.querySelector('[role="status"][aria-label*="Loading"]')),
    hudText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 500),
  }
})
console.log('INFO', JSON.stringify(info, null, 2))

if (!info.canvas) problems.push('ASSERT: no <canvas> rendered')
if (!info.webgl) problems.push('ASSERT: WebGL unavailable')
if (info.loadingVisible) problems.push('ASSERT: loading screen never finished')
if (!/Educational Scale/.test(info.hudText)) problems.push('ASSERT: HUD scale controls missing')

await page.screenshot({ path: `${OUT}/1-main.png` })

// Explore & Learn
await page.getByRole('button', { name: /Explore & Learn/i }).click()
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/2-learn.png` })

// Sizes lesson
await page.getByRole('button', { name: /Planet Sizes/i }).click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/3-sizes.png` })

await page.keyboard.press('Escape')
await page.waitForTimeout(500)

// What If?
await page.getByRole('button', { name: /What If\?/i }).first().click()
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/4-whatif.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(400)

// Cinematic tour
await page.getByRole('button', { name: /Cinematic Tour/i }).click()
await page.waitForTimeout(4000)
await page.screenshot({ path: `${OUT}/5-tour.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(600)

// Focus a planet with the keyboard (3 = Earth)
await page.keyboard.press('3')
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/6-focus-earth.png` })

// Spacecraft mode
await page.keyboard.press('c')
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/7-spacecraft.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(700)
if ((await page.getByText('MISSION CONTROL').count()) > 0) {
  problems.push('ASSERT: Escape did not exit spacecraft mode')
}

// Random fact card
await page.keyboard.press('r')
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/8-fact.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(700)
if ((await page.locator('[role="dialog"]').count()) > 0) {
  problems.push('ASSERT: Escape did not close the fact card')
}
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(1500)
const finalState = {
  dialogs: await page.locator('[role="dialog"]').count(),
  missionControl: await page.getByText('MISSION CONTROL').count(),
  labels: await page.locator('.body-label:visible').count(),
}
console.log('FINAL STATE:', JSON.stringify(finalState))
if (finalState.dialogs > 0) problems.push('ASSERT: a modal is open on mobile')
if (finalState.missionControl > 0) problems.push('ASSERT: spacecraft mode still active')
if (finalState.labels === 0) problems.push('ASSERT: no body labels visible')
await page.screenshot({ path: `${OUT}/9-mobile.png` })

console.log('\nCONSOLE MESSAGES:', logs.length)
const uniqueProblems = [...new Set(problems)]
console.log('\nPROBLEMS:', uniqueProblems.length)
uniqueProblems.forEach((line) => console.log('  -', line))

await browser.close()
process.exit(uniqueProblems.length > 0 ? 1 : 0)
