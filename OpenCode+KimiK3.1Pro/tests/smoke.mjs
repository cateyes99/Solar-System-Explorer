import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'

const edgePath = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
if (!existsSync(edgePath)) throw new Error('Set CHROME_PATH to a Chromium-based browser executable.')
mkdirSync('artifacts', { recursive: true })
const browser = await chromium.launch({ executablePath: edgePath, headless: true, args: ['--enable-unsafe-swiftshader'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const ready = async (target = page) => {
  await target.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await target.locator('.loading-screen').waitFor({ state: 'detached', timeout: 30000 })
  await target.waitForTimeout(900)
}

try {
  await ready()
  assert(await page.locator('canvas').count() > 0, 'The 3D canvas did not start.')
  await page.screenshot({ path: 'artifacts/astra-desktop.png' })
  console.log('✓ Startup and desktop scene')

  await page.getByRole('button', { name: 'Visit Earth', exact: true }).click()
  await page.locator('.planet-panel').waitFor()
  assert((await page.locator('.planet-panel').innerText()).includes('12,742'), 'Earth data is missing.')
  await page.getByRole('button', { name: 'Follow', exact: true }).click()
  await page.waitForTimeout(1800)
  await page.screenshot({ path: 'artifacts/astra-earth.png' })
  console.log('✓ Planet selection, information, and follow camera')

  await page.getByRole('button', { name: 'Pause simulation', exact: true }).click()
  const pausedDate = await page.locator('.simulation-date time').innerText()
  await page.waitForTimeout(400)
  assert(await page.locator('.simulation-date time').innerText() === pausedDate, 'Time did not pause.')
  await page.getByRole('button', { name: 'Fast', exact: true }).click()
  await page.getByRole('button', { name: 'Advance one simulated day', exact: true }).click()
  console.log('✓ Pause, speed, and time advance')

  await page.locator('.view-system-button').click()
  await page.locator('.tour-card').click()
  await page.locator('.tour-controls').waitFor()
  await page.getByRole('button', { name: 'Skip stop', exact: true }).click()
  assert((await page.locator('.tour-controls__top small').innerText()).startsWith('02'), 'Tour did not skip.')
  await page.getByRole('button', { name: 'Pause tour', exact: true }).click()
  await page.getByRole('button', { name: 'Resume tour', exact: true }).click()
  await page.getByRole('button', { name: 'Exit cinematic tour', exact: true }).click()
  console.log('✓ Cinematic tour, skip, pause, resume, and exit')

  await page.getByRole('button', { name: 'Explore & Learn', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.locator('.lesson-list').getByRole('button', { name: /Planet sizes/ }).click()
  await page.locator('.comparison-sphere').first().waitFor()
  assert(await page.locator('.comparison-sphere').count() === 2, 'Size comparison did not render.')
  await page.waitForTimeout(650)
  await page.screenshot({ path: 'artifacts/astra-learn.png' })
  await page.locator('.lesson-list').getByRole('button', { name: /Gravity lab/ }).click()
  await page.getByRole('slider', { name: 'Planet mass in Earth masses' }).press('ArrowRight')
  await page.getByRole('button', { name: 'Close Explore & Learn' }).click()
  console.log('✓ Educational lessons and interactive controls')

  await page.getByRole('button', { name: 'What if?', exact: true }).click()
  await page.getByRole('button', { name: /A second Moon/ }).click()
  await page.locator('.what-if-banner').waitFor()
  await page.getByRole('button', { name: 'Reset experiment', exact: true }).click()
  console.log('✓ Hypothetical simulation and reset')

  await page.getByRole('button', { name: 'Missions', exact: true }).click()
  await page.locator('.mission-control').waitFor()
  await page.locator('.destination-select select').selectOption('mars')
  await page.getByRole('button', { name: 'Release camera', exact: true }).click()
  await page.getByRole('button', { name: 'Exit spacecraft mode', exact: true }).click()
  console.log('✓ Spacecraft destination, autopilot, and camera controls')

  await page.getByRole('button', { name: 'Open settings', exact: true }).click()
  await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click()
  assert(await page.locator('html').getAttribute('data-reduced-motion') === 'true', 'Reduced motion was not applied.')
  await page.getByRole('switch', { name: 'Reduce motion', exact: true }).click()
  await page.getByRole('button', { name: 'Close Mission settings' }).click()
  await page.getByRole('button', { name: 'Change visualization scale' }).click()
  await page.getByRole('button', { name: /Relative size/ }).click()
  await page.getByRole('button', { name: /Educational scale/ }).click()
  await page.getByRole('button', { name: 'Close Choose your perspective' }).click()
  await page.getByRole('button', { name: 'Teach me!', exact: true }).click()
  await page.locator('.fact-card').waitFor()
  await page.getByRole('button', { name: 'Another discovery' }).click()
  await page.getByRole('button', { name: 'Close A little cosmic wonder' }).click()
  console.log('✓ Settings, reduced motion, scale modes, and facts')

  await page.setViewportSize({ width: 390, height: 844 })
  await ready()
  await page.screenshot({ path: 'artifacts/astra-mobile.png' })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile layout overflows horizontally.')
  await page.getByRole('button', { name: 'Visit Earth', exact: true }).click()
  await page.locator('.planet-panel').waitFor()
  await page.waitForTimeout(550)
  await page.screenshot({ path: 'artifacts/astra-mobile-panel.png' })
  console.log('✓ Mobile layout and bottom-sheet information')

  const fallback = await context.newPage()
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
      return original.call(this, type, ...args)
    }
  })
  await ready(fallback)
  assert(await fallback.locator('.fallback-system').count() === 1, 'Fallback page closed unexpectedly.')
  assert((await fallback.locator('.fallback-notice').innerText()).includes('2D explorer mode'), 'WebGL fallback did not appear.')
  await fallback.getByRole('button', { name: 'Learn about Earth', exact: true }).click()
  await fallback.locator('.planet-panel').waitFor()
  await fallback.close()
  console.log('✓ WebGL failure fallback')

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`)
  console.log('✓ No browser console or runtime errors')
} finally {
  await browser.close()
}
