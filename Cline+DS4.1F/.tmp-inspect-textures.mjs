/**
 * Temporary: reports the real pixel statistics of the downloaded maps, so the
 * material setup can be based on what the files actually contain.
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

const dir = 'public/textures'
const files = readdirSync(dir).filter((name) => /\.(jpg|png)$/.test(name))
const payload = Object.fromEntries(
  files.map((name) => [
    name,
    `data:${name.endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,` +
      readFileSync(join(dir, name)).toString('base64'),
  ]),
)

const browser = await puppeteer.launch({ headless: true, executablePath: resolveBrowser(), args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('about:blank')

const stats = await page.evaluate(async (images) => {
  const out = {}
  for (const [name, url] of Object.entries(images)) {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let min = [255, 255, 255], max = [0, 0, 0], sum = [0, 0, 0], minA = 255
    const samples = data.length / 4
    for (let i = 0; i < samples; i += 1) {
      for (let c = 0; c < 3; c += 1) {
        const v = data[i * 4 + c]
        if (v < min[c]) min[c] = v
        if (v > max[c]) max[c] = v
        sum[c] += v
      }
      if (data[i * 4 + 3] < minA) minA = data[i * 4 + 3]
    }
    const at = (x, y) => [...data.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 4)]
    // Are all ring rows identical? (matters for how the disc UVs map)
    let rowsIdentical = true
    if (canvas.height > 1) {
      const mid = Math.floor(canvas.height / 2)
      for (const y of [0, 1, canvas.height - 2, canvas.height - 1]) {
        for (let x = 0; x < canvas.width; x += 17) {
          if (at(x, y).join() !== at(x, mid).join()) {
            rowsIdentical = false
            break
          }
        }
        if (!rowsIdentical) break
      }
    }
    out[name] = {
      size: `${canvas.width}x${canvas.height}`,
      min,
      max,
      mean: sum.map((v) => Math.round(v / samples)),
      minAlpha: minA,
      rowsIdentical,
      corners: { tl: at(1, 1), tr: at(canvas.width - 2, 1), bl: at(1, canvas.height - 2) },
    }
  }
  return out
}, payload)

for (const [name, s] of Object.entries(stats)) {
  console.log(
    `${name.padEnd(28)} ${s.size.padEnd(10)} min ${s.min.join(',')}  max ${s.max.join(',')}  mean ${s.mean.join(',')}  minA ${s.minAlpha}  rowsEqual ${s.rowsIdentical}  tl ${s.corners.tl.join(',')}`,
  )
}

// Where the ring gaps land, as a fraction of the strip width.
const ring = await page.evaluate(async (url) => {
  const image = new Image()
  image.src = url
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  const mid = Math.floor(canvas.height / 2)
  const data = ctx.getImageData(0, mid, canvas.width, 1).data
  const profile = []
  for (let x = 0; x < canvas.width; x += 1) profile.push(Math.round((data[x * 4 + 3] / 255) * 100))
  const dips = []
  for (let x = 2; x < canvas.width - 2; x += 1) {
    const v = profile[x]
    if (v < profile[x - 2] && v < profile[x + 2] && v <= 22) dips.push([+(x / (canvas.width - 1)).toFixed(3), v])
  }
  return { profile, dips }
}, payload['2k_saturn_ring_alpha.png'])

console.log('\nring alpha profile (u → %)')
let line = ''
for (let i = 0; i < ring.profile.length; i += 32) {
  line += `${(i / (ring.profile.length - 1)).toFixed(2)}:${String(ring.profile[i]).padStart(3)} `
}
console.log(line)
console.log('deep dips (u, %)', JSON.stringify(ring.dips.slice(0, 40)))

await browser.close()
