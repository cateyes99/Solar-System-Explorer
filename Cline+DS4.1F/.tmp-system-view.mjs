/**
 * Temporary: a wide view with a world selected, to prove the selection marker
 * still appears once the camera is far enough out (the fade must only remove the
 * cue where it would cut across the planet, not where it is the cue).
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

await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Quick travel to a world"]')
  const button = [...(nav?.querySelectorAll('button') ?? [])].find((element) =>
    element.textContent?.includes('Saturn'),
  )
  button?.click()
})
await sleep(6500)

await page.mouse.move(640, 400)
for (let step = 0; step < 46; step += 1) {
  await page.mouse.wheel({ deltaY: 320 })
  await sleep(120)
}
await sleep(2500)

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
await sleep(700)
const base64 = await page.screenshot({ encoding: 'base64' })
writeFileSync('verify-marker-system.png', Buffer.from(base64, 'base64'))

// How much cream-coloured (accent) light sits around Saturn's own pixels: the
// marker is #f0dfae additive, so it lifts red and green well above blue.
const accent = await page.evaluate(async (data) => {
  const image = new Image()
  image.src = `data:image/png;base64,${data}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  let cream = 0
  let bright = 0
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    if (r > 90 && r > b + 25 && g > b + 12 && r >= g) cream += 1
    if (r + g + b > 480) bright += 1
  }
  return { creamPixels: cream, brightPixels: bright }
}, base64)

console.log(JSON.stringify({ accent, messages }, null, 2))
await browser.close()
