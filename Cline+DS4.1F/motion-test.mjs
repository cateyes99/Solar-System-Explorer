/**
 * Temporary focused test for simulated time (not part of the shipped app).
 *
 * The bodies in the scene derive their positions from the simulation clock, so a
 * clock that never advances shows up as "nothing moves, whatever the speed".
 * This script measures that from the outside: it samples the on-screen position
 * of the planet labels plus the HUD read-out, then checks four things —
 *
 *   1. the default speed advances the simulated date,
 *   2. "A Year a Second" visibly moves every planet and the comet,
 *   3. pausing freezes both the date and the positions,
 *   4. playing again brings the motion back.
 *
 * Usage: npm run build && npx vite preview --port 4173  (then)
 *        node motion-test.mjs [url] [outDir]
 */
import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

function resolveBrowser() {
  const cacheRoot = join(homedir(), '.cache', 'puppeteer', 'chrome')
  if (existsSync(cacheRoot)) {
    for (const entry of readdirSync(cacheRoot)) {
      const candidate = join(cacheRoot, entry, 'chrome-win64', 'chrome.exe')
      if (existsSync(candidate)) return candidate
    }
  }
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  if (existsSync(edge)) return edge
  return undefined
}

const url = process.argv[2] ?? 'http://localhost:4173/'
const outDir = process.argv[3] ?? '.'
mkdirSync(outDir, { recursive: true })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const browser = await puppeteer.launch({
  headless: true,
  executablePath: resolveBrowser(),
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--window-size=1440,900',
  ],
})

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

const messages = []
page.on('console', (message) => {
  const type = message.type()
  if (type === 'error' || type === 'warning') messages.push(`[${type}] ${message.text()}`)
})
page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`))

await page.goto(url, { waitUntil: 'load', timeout: 60000 })
let ready = true
try {
  await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
} catch {
  ready = false
}
await sleep(4000)


/** Everything about motion we can observe from the DOM: labels plus the HUD. */
const sample = () =>
  page.evaluate(() => {
    const positions = [...document.querySelectorAll('.sse-planet-label')].map((element) => {
      const rect = element.getBoundingClientRect()
      return { name: (element.textContent ?? '?').trim(), x: Math.round(rect.x), y: Math.round(rect.y) }
    })
    const hud = document.querySelector('[aria-label="Time controls"]')
    const dateField = hud?.querySelector('input[type="date"]')
    return {
      positions,
      date: dateField ? dateField.value : null,
      hudText: (hud?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
    }
  })

const distances = (a, b) =>
  a.positions.map((position, index) => {
    const other = b.positions[index]
    if (!other) return null
    return { name: position.name, moved: Math.round(Math.hypot(other.x - position.x, other.y - position.y)) }
  })

const maxMoved = (a, b) => {
  const all = distances(a, b).filter(Boolean).map((entry) => entry.moved)
  return all.length > 0 ? Math.max(...all) : 0
}

const report = {
  url,
  interfaceReady: ready,
  hasCanvas: await page.evaluate(() => Boolean(document.querySelector('canvas'))),
  usingFallback2D: await page.evaluate(() => document.body.innerText.includes('Simplified 2D view')),
}

// 1. Default speed: 1 day per second, so the date must march on.
const playA = await sample()
await sleep(2000)
const playB = await sample()
report.defaultSpeed = {
  date: [playA.date, playB.date],
  dateAdvanced: playA.date !== playB.date,
  labelCount: playA.positions.length,
  maxMovedPixels: maxMoved(playA, playB),
}

// 2. Fast: a whole year per second (keyboard "5") — every world must move.
// Sampled three times, because at one year per second a body can end up back
// where it started by coincidence; only a body that never moves is frozen.
await page.keyboard.press('Digit5')
await sleep(600)
const fastSamples = []
for (let i = 0; i < 3; i += 1) {
  fastSamples.push(await sample())
  await page.screenshot({ path: `${outDir}/motion-${i + 1}-fast.png` })
  await sleep(700)
}
const fastIntervals = [distances(fastSamples[0], fastSamples[1]), distances(fastSamples[1], fastSamples[2])]
const everMoved = new Set(
  fastIntervals.flat().filter(Boolean).filter((entry) => entry.moved > 0).map((entry) => entry.name),
)
report.fastSpeed = {
  hud: fastSamples.map((entry) => entry.hudText),
  dateAdvanced: fastSamples[0].date !== fastSamples[2].date,
  movedPixels: fastIntervals,
  maxMovedPixels: Math.max(0, ...fastIntervals.flat().filter(Boolean).map((entry) => entry.moved)),
  frozenBodies: fastSamples[0].positions.map((entry) => entry.name).filter((name) => !everMoved.has(name)),
}

// 3. Paused: the clock must stop dead.
await page.keyboard.press('Space')
await sleep(600)
const pausedA = await sample()
await sleep(1600)
const pausedB = await sample()
report.paused = {
  dateFrozen: pausedA.date === pausedB.date,
  maxMovedPixels: maxMoved(pausedA, pausedB),
  identicalLabelPositions: JSON.stringify(pausedA.positions) === JSON.stringify(pausedB.positions),
}

// 4. Playing again: motion must come back.
await page.keyboard.press('Space')
await sleep(600)
const resumeA = await sample()
await sleep(1600)
const resumeB = await sample()
report.resumed = {
  dateAdvanced: resumeA.date !== resumeB.date,
  maxMovedPixels: maxMoved(resumeA, resumeB),
}

const passed =
  report.interfaceReady &&
  report.hasCanvas &&
  !report.usingFallback2D &&
  report.defaultSpeed.dateAdvanced &&
  report.fastSpeed.dateAdvanced &&
  report.fastSpeed.frozenBodies.length === 0 &&
  report.fastSpeed.maxMovedPixels > 20 &&
  report.paused.dateFrozen &&
  report.paused.maxMovedPixels === 0 &&
  report.resumed.dateAdvanced &&
  report.resumed.maxMovedPixels > 20

report.messages = messages
report.verdict = passed ? 'PASS — simulated time moves the Solar System' : 'FAIL — the scene is not moving'
writeFileSync(`${outDir}/motion-report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
process.exitCode = passed ? 0 : 1
await browser.close()
