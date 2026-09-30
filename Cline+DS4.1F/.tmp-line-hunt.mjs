/**
 * Temporary: hunts the thin vertical line that shows up through Saturn's disc.
 *
 * A vertical line over a planet can only come from a curve that passes close to
 * the camera, so the prime suspect is the planet's own orbit path: the camera
 * sits a few units from Saturn, and Saturn's orbit ellipse passes through it.
 * This renders the same view with orbit paths on and off and counts the columns
 * that are consistently brighter or darker than both of their neighbours.
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

await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
    element.textContent?.includes('Saturn'),
  )
  button?.click()
})
await sleep(6500)
await page.mouse.move(640, 400)
for (let step = 0; step < 7; step += 1) {
  await page.mouse.wheel({ deltaY: -320 })
  await sleep(220)
}
await sleep(2500)
await setHudHidden(true)
await sleep(700)

/** Reads a screenshot and reports any column that is a thin vertical line. */
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

    // Locate the disc: the thresholded extent of the bright centre object.
    const threshold = 0.5
    let left = width
    let right = -1
    let top = height
    let bottom = -1
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (luma[y * width + x] < threshold) continue
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }

    /**
     * A vertical line is one column that stands out from both neighbours over a
     * long run of rows: its horizontal neighbours share the same shading, so only
     * something running up the image can do that.
     */
    const scan = (rowFrom, rowTo, label) => {
      const rows = rowTo - rowFrom + 1
      const columns = []
      for (let x = Math.max(1, left); x <= Math.min(width - 2, right); x += 1) {
        let strong = 0
        let signed = 0
        let red = 0
        let green = 0
        let blue = 0
        for (let y = rowFrom; y <= rowTo; y += 1) {
          const index = y * width + x
          const deviation = luma[index] - (luma[index - 1] + luma[index + 1]) / 2
          if (Math.abs(deviation) > 0.04) strong += 1
          signed += deviation
          red += pixels[index * 4]
          green += pixels[index * 4 + 1]
          blue += pixels[index * 4 + 2]
        }
        columns.push({
          x,
          strongFraction: Number((strong / rows).toFixed(3)),
          meanDeviation: Number((signed / rows).toFixed(4)),
          rgb: [Math.round(red / rows), Math.round(green / rows), Math.round(blue / rows)],
        })
      }
      const lines = columns.filter((column) => column.strongFraction > 0.5)
      const worst = [...lines]
        .sort((a, b) => b.strongFraction - a.strongFraction || Math.abs(b.meanDeviation) - Math.abs(a.meanDeviation))
        .slice(0, 6)
      return { label, rows, lineColumnCount: lines.length, worst }
    }

    const disc = { left, right, top, bottom, widthPx: right - left + 1, heightPx: bottom - top + 1 }
    return {
      frame: `${width}x${height}`,
      disc,
      insideDisc: scan(top, bottom, 'rows across the disc'),
      wholeFrame: scan(2, height - 3, 'rows across the whole frame'),
    }
  }, base64)

const beforeShot = await page.screenshot({ encoding: 'base64' })
writeFileSync('verify-line-before.png', Buffer.from(beforeShot, 'base64'))
const before = await measure(beforeShot)

const toggle = await page.evaluate(() => {
  const controls = [...document.querySelectorAll('input[type="checkbox"], button[role="switch"], button')]
  for (const control of controls) {
    const row = control.closest('label') ?? control.parentElement?.parentElement ?? control.parentElement
    const text = `${control.getAttribute('aria-label') ?? ''} ${row?.textContent ?? ''}`
    if (text.includes('Orbit paths')) {
      const stateBefore = control.checked ?? control.getAttribute('aria-checked')
      control.click()
      return {
        found: true,
        tag: control.tagName,
        stateBefore,
        stateAfter: control.checked ?? control.getAttribute('aria-checked'),
      }
    }
  }
  return { found: false, reason: `no orbit toggle among ${controls.length} controls` }
})
await sleep(1500)

const afterShot = await page.screenshot({ encoding: 'base64' })
writeFileSync('verify-line-after.png', Buffer.from(afterShot, 'base64'))
const after = await measure(afterShot)

console.log(JSON.stringify({ toggle, before, after, messages }, null, 2))
await browser.close()
