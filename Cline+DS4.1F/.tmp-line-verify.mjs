/**
 * Temporary: measures the thin bright line that a wide-view cue can draw across
 * a close-up planet, before and after the fade fix.
 *
 * `verify-line-before.png` and `verify-saturn.png` were captured earlier, when
 * the flat selection marker and Saturn's own orbit path were still drawn at full
 * strength a few planet radii out. The live poses at the end of this script are
 * captured from the current source, so the two sets of numbers are directly
 * comparable: the stored frames must show the line, the live frames must not.
 */
import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
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

const browser = await puppeteer.launch({
  headless: true,
  executablePath: resolveBrowser(),
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--window-size=1280,860',
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 1 })
const messages = []
page.on('pageerror', (error) => messages.push(`[pageerror] ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') messages.push(`[console] ${message.text()}`)
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
await page.goto('http://localhost:5173/', { waitUntil: 'load', timeout: 60000 })
await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
await sleep(6000)

const setHudHidden = (hide) =>
  page.evaluate((hidden) => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    let node = canvas
    while (node.parentElement) {
      const parent = node.parentElement
      for (const sibling of [...parent.children]) {
        if (sibling === node || sibling.tagName === 'CANVAS') continue
        if (hidden) {
          sibling.dataset.verifyPrev = sibling.style.display
          sibling.style.display = 'none'
        } else if (sibling.dataset.verifyPrev !== undefined) {
          sibling.style.display = sibling.dataset.verifyPrev
          delete sibling.dataset.verifyPrev
        }
      }
      node = parent
    }
  }, hide)
/**
 * Counts the columns of a frame that carry a thin vertical line.
 *
 * A thin line is measured as a crest: the pixel has to be clearly brighter (or
 * darker) than *both* horizontal neighbours at once, which a smooth surface, a
 * horizontal cloud band and even a hard vertical edge (a ring limb, say) all
 * fail. Only something one or two pixels wide running up the image passes.
 */
const measure = (base64) =>
  page.evaluate(async (data) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const { width, height } = canvas
    const pixels = ctx.getImageData(0, 0, width, height).data
    const luma = new Float32Array(width * height)
    for (let i = 0; i < width * height; i += 1) {
      luma[i] = (pixels[i * 4] * 0.299 + pixels[i * 4 + 1] * 0.587 + pixels[i * 4 + 2] * 0.114) / 255
    }

    // --- The disc: bright pixels in a long horizontal run, so neither the
    // scattered nebula nor lone stars can stretch the box around it.
    const BRIGHT = 0.55
    const MIN_RUN = 12
    let left = width
    let right = -1
    let top = height
    let bottom = -1
    for (let y = 0; y < height; y += 1) {
      let run = 0
      for (let x = 0; x <= width; x += 1) {
        if (x < width && luma[y * width + x] > BRIGHT) {
          run += 1
          continue
        }
        if (run >= MIN_RUN) {
          if (x - run < left) left = x - run
          if (x - 1 > right) right = x - 1
          if (y < top) top = y
          if (y > bottom) bottom = y
        }
        run = 0
      }
    }

    const columns = []
    for (let x = Math.max(1, left); x <= Math.min(width - 2, right); x += 1) {
      let crest = 0
      let trough = 0
      let counted = 0
      let red = 0
      let green = 0
      let blue = 0
      for (let y = top; y <= bottom; y += 1) {
        const index = y * width + x
        if (luma[index] < 0.3) continue
        counted += 1
        const up = luma[index] - luma[index - 1]
        const down = luma[index] - luma[index + 1]
        if (up > 0.03 && down > 0.03) crest += 1
        else if (up < -0.03 && down < -0.03) trough += 1
        red += pixels[index * 4]
        green += pixels[index * 4 + 1]
        blue += pixels[index * 4 + 2]
      }
      columns.push({
        x,
        rows: counted,
        crestFraction: counted ? Number((crest / counted).toFixed(3)) : 0,
        troughFraction: counted ? Number((trough / counted).toFixed(3)) : 0,
        rgb: counted
          ? [Math.round(red / counted), Math.round(green / counted), Math.round(blue / counted)]
          : [0, 0, 0],
      })
    }

    const lines = columns.filter((column) => Math.max(column.crestFraction, column.troughFraction) > 0.15)
    const worst = [...columns]
      .sort(
        (a, b) =>
          Math.max(b.crestFraction, b.troughFraction) - Math.max(a.crestFraction, a.troughFraction),
      )
      .slice(0, 5)

    return {
      frame: `${width}x${height}`,
      disc: { left, right, top, bottom, widthPx: right - left + 1, heightPx: bottom - top + 1 },
      lineColumns: lines.length,
      worstColumns: worst,
    }
  }, base64)

const report = { storedFrames: {}, livePoses: {}, messages }

for (const file of ['verify-saturn.png', 'verify-line-before.png']) {
  if (!existsSync(file)) continue
  const data = readFileSync(file).toString('base64')
  report.storedFrames[file] = await measure(data)
}

const focusSaturn = async () => {
  const clicked = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
    const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
      element.textContent?.includes('Saturn'),
    )
    button?.click()
    return Boolean(button)
  })
  await sleep(7000)
  return clicked
}

const zoom = async (steps) => {
  await page.mouse.move(640, 400)
  for (let step = 0; step < Math.abs(steps); step += 1) {
    await page.mouse.wheel({ deltaY: steps > 0 ? -320 : 320 })
    await sleep(200)
  }
  await sleep(2200)
}

const capture = async (name) => {
  await setHudHidden(true)
  await sleep(700)
  const base64 = await page.screenshot({ encoding: 'base64' })
  writeFileSync(`verify-marker-${name}.png`, Buffer.from(base64, 'base64'))
  await setHudHidden(false)
  await sleep(300)
  return measure(base64)
}

// Arrival framing is about eight planet radii out — close enough that the old
// code drew the marker straight across the disc. The retry covers a slow start,
// where the first click can land before the interface is listening.
report.clicked = await focusSaturn()
report.livePoses.arrival = await capture('arrival')
for (let attempt = 0; attempt < 3 && report.livePoses.arrival.disc.widthPx > 900; attempt += 1) {
  report.retried = (report.retried ?? 0) + 1
  await focusSaturn()
  report.livePoses.arrival = await capture('arrival')
}
await zoom(7)
report.livePoses.close = await capture('close')

// Back out to a wide view, where both cues are supposed to be at full strength.
await zoom(-16)
report.livePoses.wide = await capture('wide')

console.log(JSON.stringify(report, null, 2))
await browser.close()

