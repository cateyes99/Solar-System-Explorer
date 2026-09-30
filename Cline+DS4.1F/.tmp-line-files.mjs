/**
 * Temporary: counts thin bright lines across a planet's disc in saved frames.
 *
 * The scan is restricted to the bright tan surface of the planet itself — its
 * own rings are darker, so they cannot be mistaken for the line — and a line
 * only counts when a pixel beats *both* horizontal neighbours, which is what
 * tells a one-pixel line apart from a cloud band or a ring edge.
 */
import puppeteer from 'puppeteer'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
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

const files = process.argv.slice(2)
const browser = await puppeteer.launch({
  headless: true,
  executablePath: resolveBrowser(),
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
await page.goto('about:blank', { waitUntil: 'load' })

const report = {}
for (const file of files) {
  const base64 = readFileSync(file).toString('base64')
  report[file] = await page.evaluate(async (data) => {
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

    // The planet itself: bright tan pixels in a long horizontal run.
    const DISC_LUMA = 0.66
    const MIN_RUN = 25
    let left = width
    let right = -1
    let top = height
    let bottom = -1
    for (let y = 0; y < height; y += 1) {
      let run = 0
      for (let x = 0; x <= width; x += 1) {
        if (x < width && luma[y * width + x] > DISC_LUMA) {
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

    /**
     * A cue that crosses the disc is a narrow band standing out from the surface
     * around it: comparing each column with columns 40 px to either side skips the
     * band whatever its width, while the smooth limb darkening around it stays
     * flat, and no horizontal cloud band can contribute.
     */
    const OFFSET = 40
    // Everything below compares *surface* with surface: pixels dimmer than this
    // belong to the rings, the limb or open space, and a comparison that runs off
    // the planet must not read as a line on it.
    const SURFACE = 0.62
    const columns = []
    for (let x = Math.max(OFFSET, left); x <= Math.min(width - 1 - OFFSET, right); x += 1) {
      let sum = 0
      let counted = 0
      for (let y = top; y <= bottom; y += 1) {
        const index = y * width + x
        const behind = luma[index - OFFSET]
        const ahead = luma[index + OFFSET]
        if (luma[index] < SURFACE || behind < SURFACE || ahead < SURFACE) continue
        counted += 1
        sum += luma[index] - (behind + ahead) / 2
      }
      if (!counted) continue
      columns.push({
        x,
        rows: counted,
        excess: Number((sum / counted).toFixed(4)),
      })
    }

    // On a clean planet every column sits within a hundredth or so of its
    // neighbours; a cue drawn across the disc adds ten times that, and — unlike a
    // ring edge or a limb — it stands out over most of the disc's height.
    const LINE_EXCESS = 0.05
    const LINE_ROWS = Math.max(20, Math.round((bottom - top + 1) * 0.4))
    const lines = columns.filter((column) => column.excess > LINE_EXCESS && column.rows >= LINE_ROWS)
    const worst = [...columns].sort((a, b) => b.excess - a.excess).slice(0, 6)
    return {
      frame: `${width}x${height}`,
      disc: { left, right, top, bottom, widthPx: right - left + 1, heightPx: bottom - top + 1 },
      lineRowsRequired: LINE_ROWS,
      lineColumns: lines.length,
      lineColumnsDetail: lines.slice(0, 4),
      worstColumns: worst,
    }
  }, base64)
  console.log(`measured ${file}`)
}

console.log(JSON.stringify(report, null, 2))
await browser.close()
