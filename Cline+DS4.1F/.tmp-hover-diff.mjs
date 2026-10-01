/**
 * Temporary: every captured Earth frame measured over one fixed circle, so the
 * hovered / pointer-away states and the before / after builds are all comparable
 * pixel for pixel. The frames are read straight off disk with a local-file
 * browser run (`--allow-file-access-from-files`), so the harness needs no server
 * and the canvas stays readable.
 */
import puppeteer from 'puppeteer'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { pathToFileURL } from 'node:url'

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

const files = [
  'verify-hover-before-away-again.png',
  'verify-hover-before-hover.png',
  'verify-hover-after-away-again.png',
  'verify-hover-after-hover.png',
]

const browser = await puppeteer.launch({
  headless: true,
  executablePath: resolveBrowser(),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'],
})
const page = await browser.newPage()
const shots = files.map((name) => ({
  name,
  url: pathToFileURL(join(import.meta.dirname, name)).href,
}))
await page.goto(shots[0].url, { waitUntil: 'load', timeout: 60000 })

const results = await page.evaluate(async (images) => {
  const CENTRE = { x: 641.8, y: 405.4 }
  const RADIUS = 100
  const out = []
  for (const { name, url } of images) {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const values = []
    let red = 0
    let blue = 0
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const dx = x - CENTRE.x
        const dy = y - CENTRE.y
        if (dx * dx + dy * dy > RADIUS * RADIUS) continue
        const i = (y * canvas.width + x) * 4
        values.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3)
        red += pixels[i]
        blue += pixels[i + 2]
      }
    }
    values.sort((a, b) => a - b)
    const share = (fraction) => Math.floor(values.length * fraction)
    const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length
    out.push({
      name,
      pixels: values.length,
      meanLuma: +mean(values).toFixed(2),
      darkQuartile: +mean(values.slice(0, share(0.25))).toFixed(2),
      brightDecile: +mean(values.slice(values.length - share(0.1))).toFixed(2),
      meanB: +(blue / values.length).toFixed(2),
      meanR: +(red / values.length).toFixed(2),
      litFraction: +(values.filter((value) => value > 60).length / values.length).toFixed(3),
    })
  }
  return out
}, shots)

const by = Object.fromEntries(results.map((row) => [row.name, row]))
const before = ['verify-hover-before-away-again.png', 'verify-hover-before-hover.png']
const after = ['verify-hover-after-away-again.png', 'verify-hover-after-hover.png']
const delta = (a, b) => +(by[a].meanLuma - by[b].meanLuma).toFixed(2)

console.log(
  JSON.stringify(
    {
      frames: results,
      summary: {
        beforeHoverMinusAway: delta(before[1], before[0]),
        afterHoverMinusAway: delta(after[1], after[0]),
        awayBeforeMinusAfter: delta(before[0], after[0]),
        beforeAwayDarkQuartileMinusAfterAway: +(
          by[before[0]].darkQuartile - by[after[0]].darkQuartile
        ).toFixed(2),
        litFractionBeforeAway: by[before[0]].litFraction,
        litFractionAfterAway: by[after[0]].litFraction,
        litFractionAfterHover: by[after[1]].litFraction,
      },
    },
    null,
    2,
  ),
)
await browser.close()
