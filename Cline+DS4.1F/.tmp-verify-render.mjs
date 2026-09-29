/**
 * Temporary: measures the rendered result in headless Chrome.
 *
 * Everything here is checked against a measurement rather than an opinion — the
 * Sun's limb darkening (a radial brightness profile), Jupiter's flattening (disc
 * width ÷ height), Saturn's ring span (outer edge ÷ planet radius) and Earth's
 * cloud contrast. The HUD is hidden for the screenshots so the interface cannot
 * contaminate the pixels.
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

const url = process.argv[2] ?? 'http://localhost:4173/'
const outDir = process.argv[3] ?? '.'
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
await page.goto(url, { waitUntil: 'load', timeout: 60000 })
await page.waitForSelector('nav[aria-label="Quick travel to a world"]', { timeout: 120000 })
await sleep(6000)

/**
 * Hides every DOM layer except the canvas, whatever element types they use: it
 * walks up from the canvas and hides each sibling on the way, so no panel, toast
 * or overlay can end up in the pixels being measured.
 */
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

const focusBody = async (name) => {
  const clicked = await page.evaluate((needle) => {
    const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
    const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
      element.textContent?.includes(needle),
    )
    button?.click()
    return Boolean(button)
  }, name)
  await sleep(6500)
  return clicked
}

/** Reads the whole frame once and returns numbers about what is on screen. */
const analyse = (base64) =>
  page.evaluate(async (src) => {
    const image = new Image()
    image.src = src
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const { width, height } = canvas
    const data = ctx.getImageData(0, 0, width, height).data
    const luma = new Float32Array(width * height)
    for (let i = 0; i < width * height; i += 1) {
      luma[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255
    }

    // The body is the widest band of bright pixels, which ignores single stars.
    const threshold = 0.22
    const rowCounts = new Int32Array(height)
    for (let y = 0; y < height; y += 1) {
      let count = 0
      for (let x = 0; x < width; x += 1) if (luma[y * width + x] > threshold) count += 1
      rowCounts[y] = count
    }
    let maxCount = 0
    let maxRow = 0
    for (let y = 0; y < height; y += 1) {
      if (rowCounts[y] > maxCount) {
        maxCount = rowCounts[y]
        maxRow = y
      }
    }
    const rowLimit = Math.max(4, maxCount * 0.2)
    let top = maxRow
    let bottom = maxRow
    while (top > 0 && rowCounts[top - 1] > rowLimit) top -= 1
    while (bottom < height - 1 && rowCounts[bottom + 1] > rowLimit) bottom += 1
    const midRow = Math.round((top + bottom) / 2)

    let left = width
    let right = -1
    for (let y = top; y <= bottom; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (luma[y * width + x] > threshold) {
          if (x < left) left = x
          if (x > right) right = x
        }
      }
    }
    // Extents are also measured on one row and one column, so a wide ring plane
    // cannot inflate the planet's own width.
    const measureRow = (y) => {
      let first = -1
      let last = -1
      for (let x = 0; x < width; x += 1) {
        if (luma[y * width + x] > threshold) {
          if (first < 0) first = x
          last = x
        }
      }
      return last < 0 ? 0 : last - first + 1
    }
    const measureColumn = (x) => {
      let first = -1
      let last = -1
      for (let y = 0; y < height; y += 1) {
        if (luma[y * width + x] > threshold) {
          if (first < 0) first = y
          last = y
        }
      }
      return last < 0 ? 0 : last - first + 1
    }

    const centreX = Math.round((left + right) / 2)
    const profile = (fixed, horizontal) => {
      const samples = []
      for (let i = 0; i <= 40; i += 1) {
        const position = Math.round((i / 40) * ((horizontal ? width : height) - 1))
        const index = horizontal ? fixed * width + position : position * width + fixed
        samples.push(Number((luma[index] ?? 0).toFixed(3)))
      }
      return samples
    }

    let bright = 0
    let sum = 0
    let peak = 0
    let counted = 0
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const value = luma[y * width + x]
        if (value <= 0) continue
        counted += 1
        sum += value
        if (value > peak) peak = value
        if (value > 0.82) bright += 1
      }
    }

    return {
      frame: `${width}x${height}`,
      body: {
        left,
        right,
        top,
        bottom,
        centreX,
        midRow,
        widthPx: right - left + 1,
        heightPx: bottom - top + 1,
        brightestRowWidthPx: measureRow(midRow),
        centreColumnHeightPx: measureColumn(centreX),
        meanLuma: Number((sum / Math.max(counted, 1)).toFixed(3)),
        peakLuma: Number(peak.toFixed(3)),
        brightFraction: Number((bright / Math.max(counted, 1)).toFixed(3)),
      },
      centreRowProfile: profile(midRow, true),
      centreColumnProfile: profile(centreX, false),
    }
  }, base64)

const bodies = ['Sun', 'Jupiter', 'Saturn', 'Uranus', 'Earth', 'Mars']
const report = { url, bodies: {}, messages }
for (const name of bodies) {
  const entry = { clicked: await focusBody(name) }
  // Zoom in on whatever the camera just flew to, so the body fills the frame.
  await page.mouse.move(640, 400)
  for (let step = 0; step < 7; step += 1) {
    await page.mouse.wheel({ deltaY: -320 })
    await sleep(220)
  }
  await sleep(2500)
  await setHudHidden(true)
  await sleep(700)
  const base64 = await page.screenshot({ encoding: 'base64' })
  writeFileSync(join(outDir, `verify-${name.toLowerCase()}.png`), Buffer.from(base64, 'base64'))
  entry.image = await analyse(`data:image/png;base64,${base64}`)
  await setHudHidden(false)
  report.bodies[name] = entry
  console.log(`measured ${name}`)
}

writeFileSync(join(outDir, 'verify-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
