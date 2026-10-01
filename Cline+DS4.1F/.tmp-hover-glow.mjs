/**
 * Temporary: does the "lit glass ball" look on Earth belong to the pointer being
 * over it, or does it stick around after the world is merely selected?
 *
 * Earth is selected through the bottom-bar button (so the pointer is never over
 * the planet while it is being selected), and the simulation is paused, so the
 * frames below share one camera, one lighting state and one scene — the only
 * difference is where the pointer is. A selection-driven glow shows up as the
 * pointer-away frame being lit exactly like the hovered one.
 */
import puppeteer from 'puppeteer'
import { writeFileSync, existsSync, readdirSync } from 'node:fs'
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

const label = process.argv[2] ?? 'run'
const WIDTH = 1280
const HEIGHT = 820
const AWAY = { x: 24, y: 780 }

const browser = await puppeteer.launch({
  headless: true,
  executablePath: resolveBrowser(),
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    `--window-size=${WIDTH},${HEIGHT + 40}`,
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
const messages = []
page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') messages.push(`[console] ${message.text()}`)
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
await page.goto('http://localhost:5174/', { waitUntil: 'load', timeout: 60000 })
await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
await sleep(7000)

// Select Earth from the strip: the pointer never touches the planet here.
const clicked = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
    element.textContent?.trim().startsWith('Earth'),
  )
  button?.click()
  return Boolean(button)
})
await sleep(1500)

// Freeze the clock: paused, Earth neither orbits nor spins, so every capture
// below frames the same scene.
const paused = await page.evaluate(() => {
  const button = document.querySelector('button[aria-label="Pause the simulation"]')
  button?.click()
  return Boolean(button)
})
await sleep(12000)

// Park the pointer far from the disc, then drop the HUD so only the canvas is
// left in the screenshot (the panels would otherwise skew the pixel sampling).
await page.mouse.move(AWAY.x, AWAY.y)
await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  let node = canvas
  while (node.parentElement) {
    const parent = node.parentElement
    for (const sibling of [...parent.children]) {
      if (sibling === node || sibling.tagName === 'CANVAS') continue
      sibling.style.display = 'none'
    }
    node = parent
  }
})
await sleep(1500)

/**
 * Brightness of the disc. The mask (anything above a low floor in the middle of
 * the frame) gives the globe's centre and radius, so the numbers do not depend
 * on the exact framing. `darkDecileLuma` is the mean of the darkest tenth of the
 * disc — the night side — which is exactly the part an emissive glow lights up.
 */
const measure = async (file) => {
  const base64 = await page.screenshot({ encoding: 'base64' })
  writeFileSync(file, Buffer.from(base64, 'base64'))
  const stats = await page.evaluate(async (data) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const luma = (i) => (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3

    let area = 0
    let sumX = 0
    let sumY = 0
    for (let y = Math.floor(canvas.height * 0.15); y < canvas.height * 0.85; y += 1) {
      for (let x = Math.floor(canvas.width * 0.2); x < canvas.width * 0.8; x += 1) {
        const i = (y * canvas.width + x) * 4
        if (luma(i) < 40) continue
        area += 1
        sumX += x
        sumY += y
      }
    }
    const cx = sumX / area
    const cy = sumY / area
    const radius = Math.sqrt(area / Math.PI)

    const values = []
    let red = 0
    let blue = 0
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy > (radius * 0.8) ** 2) continue
        const i = (y * canvas.width + x) * 4
        values.push(luma(i))
        red += pixels[i]
        blue += pixels[i + 2]
      }
    }
    values.sort((a, b) => a - b)
    const decile = Math.max(1, Math.floor(values.length * 0.1))
    const head = values.slice(0, decile)
    return {
      discPixels: area,
      discRadius: +radius.toFixed(1),
      centre: [+cx.toFixed(1), +cy.toFixed(1)],
      discMeanLuma: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      darkDecileLuma: +(head.reduce((a, b) => a + b, 0) / head.length).toFixed(2),
      medianLuma: +values[Math.floor(values.length / 2)].toFixed(2),
      meanB: +(blue / values.length).toFixed(2),
      meanR: +(red / values.length).toFixed(2),
    }
  }, base64)
  return { file, ...stats }
}

// Pointer aside, twice: the two frames also prove the scene really is still.
const away = await measure(`verify-hover-${label}-away.png`)
await sleep(2000)
const awayAgain = await measure(`verify-hover-${label}-away-again.png`)

// Pointer on the middle of the globe (its centre as measured above).
await page.mouse.move(Math.round(awayAgain.centre[0]), Math.round(awayAgain.centre[1]))
await sleep(2000)
const hover = await measure(`verify-hover-${label}-hover.png`)

// Pointer away again: the glow must track the pointer, not the selection.
await page.mouse.move(AWAY.x, AWAY.y)
await sleep(2000)
const awayEnd = await measure(`verify-hover-${label}-away-end.png`)

console.log(
  JSON.stringify(
    {
      label,
      clicked,
      paused,
      away,
      awayAgain,
      hover,
      awayEnd,
      still: +(away.discMeanLuma - awayAgain.discMeanLuma).toFixed(2),
      hoverMinusAway: +(hover.discMeanLuma - awayAgain.discMeanLuma).toFixed(2),
      darkHoverMinusAway: +(hover.darkDecileLuma - awayAgain.darkDecileLuma).toFixed(2),
      messages,
    },
    null,
    2,
  ),
)
await browser.close()
