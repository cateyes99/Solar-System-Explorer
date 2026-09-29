/**
 * Temporary: verifies the textures the app builds for itself, by asking the dev
 * server's own module graph for them and reading the resulting canvases.
 *
 * The dev server is used because it can hand the page the real `textures.ts`
 * module, so `generateTextures()` runs exactly as the app runs it and the numbers
 * below are the pixels that would be uploaded to the GPU.
 */
import puppeteer from 'puppeteer'
import { existsSync, readdirSync } from 'node:fs'
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
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') console.log(`[console] ${message.text()}`)
})

await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 })

const report = await page.evaluate(async () => {
  const mod = await import('/src/utils/textures.ts')
  await mod.generateTextures('high', () => {})

  const pixels = (canvas) => {
    const context = canvas.getContext('2d')
    const { width, height } = canvas
    return { width, height, data: context.getImageData(0, 0, width, height).data }
  }
  const luma = (data, index) =>
    (data[index * 4] * 0.299 + data[index * 4 + 1] * 0.587 + data[index * 4 + 2] * 0.114) / 255

  const out = { everyTextureBuilt: mod.hasTextures() }

  // 1. Uranus's rings. The strip stores a constant particle colour and puts the
  //    whole structure in the alpha channel, so the alpha is what has to be read.
  //    Every peak should land on a published ring radius (in Uranus radii).
  const uranus = pixels(mod.getTexture('uranusRings').image)
  const uranusRow = Math.floor(uranus.height / 2)
  const uranusRadiusKm = 25_559
  const innerKm = 1.448 * uranusRadiusKm
  const outerKm = 2.005 * uranusRadiusKm
  const alphaAt = (x) => uranus.data[(uranusRow * uranus.width + x) * 4 + 3] / 255
  const radiusOf = (x) => (innerKm + ((x + 0.5) / uranus.width) * (outerKm - innerKm)) / uranusRadiusKm

  const peaks = []
  for (let x = 1; x < uranus.width - 1; x += 1) {
    const value = alphaAt(x)
    if (value < 0.05 || value < alphaAt(x - 1) || value < alphaAt(x + 1)) continue
    const previous = peaks[peaks.length - 1]
    if (previous && x - previous.x <= 3) {
      if (value > previous.alpha) {
        previous.x = x
        previous.alpha = value
      }
      continue
    }
    peaks.push({ x, alpha: value })
  }
  let opaque = 0
  let maxAlpha = 0
  for (let x = 0; x < uranus.width; x += 1) {
    const value = alphaAt(x)
    if (value > maxAlpha) maxAlpha = value
    if (value > 0.1) opaque += 1
  }
  out.uranusRings = {
    size: `${uranus.width}x${uranus.height}`,
    maxAlpha: Number(maxAlpha.toFixed(3)),
    opaqueFraction: Number((opaque / uranus.width).toFixed(4)),
    rings: peaks.map((peak) => ({
      radiusInUranusRadii: Number(radiusOf(peak.x).toFixed(3)),
      alpha: Number(peak.alpha.toFixed(3)),
    })),
  }

  // 2. Earth's clouds: a black-and-white coverage map (white = cloudy), which is
  //    exactly what makes it usable as an alpha map rather than a grey veil.
  const clouds = pixels(mod.getTexture('earthClouds').image)
  let cloudSum = 0
  let clear = 0
  let covered = 0
  const cloudCount = clouds.width * clouds.height
  for (let i = 0; i < cloudCount; i += 1) {
    const value = luma(clouds.data, i)
    cloudSum += value
    if (value < 0.1) clear += 1
    if (value > 0.85) covered += 1
  }
  out.earthClouds = {
    size: `${clouds.width}x${clouds.height}`,
    meanLuma: Number((cloudSum / cloudCount).toFixed(3)),
    clearFraction: Number((clear / cloudCount).toFixed(3)),
    coveredFraction: Number((covered / cloudCount).toFixed(3)),
  }

  // 3. Earth's roughness: oceans should come out glossy, land matte.
  const roughness = pixels(mod.getTexture('earthRoughness').image)
  let roughnessSum = 0
  let glossy = 0
  let matte = 0
  const roughnessCount = roughness.width * roughness.height
  for (let i = 0; i < roughnessCount; i += 1) {
    const value = luma(roughness.data, i)
    roughnessSum += value
    if (value < 0.25) glossy += 1
    if (value > 0.75) matte += 1
  }
  out.earthRoughness = {
    size: `${roughness.width}x${roughness.height}`,
    mean: Number((roughnessSum / roughnessCount).toFixed(3)),
    glossyFraction: Number((glossy / roughnessCount).toFixed(3)),
    matteFraction: Number((matte / roughnessCount).toFixed(3)),
  }

  // 4. The Milky Way panorama after its exposure lift: visible, but not white.
  const nebula = pixels(mod.getTexture('nebula').image)
  let nebulaSum = 0
  let nebulaMax = 0
  let nebulaBright = 0
  const nebulaCount = nebula.width * nebula.height
  for (let i = 0; i < nebulaCount; i += 1) {
    const value = luma(nebula.data, i)
    nebulaSum += value
    if (value > nebulaMax) nebulaMax = value
    if (value > 0.25) nebulaBright += 1
  }
  out.nebula = {
    size: `${nebula.width}x${nebula.height}`,
    mean: Number((nebulaSum / nebulaCount).toFixed(4)),
    max: Number(nebulaMax.toFixed(3)),
    brightFraction: Number((nebulaBright / nebulaCount).toFixed(4)),
  }

  // 5. Every other map, so a missing or blank one cannot slip through.
  out.sizes = {}
  for (const id of [
    'sun',
    'mercury',
    'venus',
    'earth',
    'earthNight',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'moon',
    'saturnRings',
    'uranusRings',
    'comet',
  ]) {
    const image = mod.getTexture(id).image
    out.sizes[id] = `${image.width}x${image.height}`
  }

  return out
})

console.log(JSON.stringify(report, null, 2))
await browser.close()
