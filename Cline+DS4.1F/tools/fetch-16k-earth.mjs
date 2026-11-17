/**
 * Builds the 16K Earth day and night maps used by the "Ultra" quality tier.
 *
 *   node tools/fetch-16k-earth.mjs
 *
 * These are the only maps in the app that ship above 8K. They are derived from
 * public-domain NASA imagery, downscaled once, offline, to 16384×8192 and
 * re-encoded as JPEG, then committed to `public/textures` alongside the 8K set
 * (so the built app still runs completely offline). They are deliberately NOT
 * fetched while the app runs: a 16K source is far too heavy to decode and
 * downscale in the browser.
 *
 * Why downscale offline: the browser decodes a JPEG at full resolution before it
 * can shrink it, so feeding a 21600 or 43200 source to the loader would cost
 * ~1–4 GB of transient memory. Pre-reducing to 16384×8192 means the loader
 * decodes 512 MB and, on a GPU that accepts 16K, uploads it with no canvas copy.
 *
 * Sources (both public domain, equirectangular 2:1):
 *  - Day:   NASA Blue Marble: Next Generation, base map (no baked topography —
 *           the app displaces real terrain itself, so shaded relief would
 *           double up). July 2004, 21600×10800.
 *  - Night: NASA Black Marble 2016 colour (Suomi NPP / VIIRS), 43200×21600,
 *           mirrored on Wikimedia Commons.
 *
 * `sharp` (libvips) is a devDependency and does the resize with JPEG
 * shrink-on-load, so even the 43200×21600 night source decodes within a modest
 * memory budget. Downloads are cached under `.cache/16k-earth` and can be
 * re-used by re-running the script.
 */
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(HERE, '..', 'public', 'textures')
const CACHE_DIR = join(HERE, '..', '.cache', '16k-earth')

/** The one resolution both Ultra maps are built at. */
const WIDTH = 16384
const HEIGHT = 8192

const DAY_SOURCE = {
  cache: 'bmng-200407-base-21600x10800.jpg',
  url: 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x21600x10800.jpg',
  output: '16k_earth_daymap.jpg',
  // The day map carries the detail a viewer inspects up close, so it is encoded
  // at a high quality; the night map is mostly black and needs less.
  quality: 90,
  // NASA's raw Blue Marble is a muted, natural composite — much darker and
  // duller than the app's tuned 8K map — so its tone is matched to the 8K one.
  // Without this, switching High↔Ultra would visibly darken the globe.
  match: '8k_earth_daymap.jpg',
}

const NIGHT_SOURCE = {
  cache: 'blackmarble-2016-43200x21600.jpg',
  // Wikimedia's Special:FilePath redirect resolves to the full-resolution file.
  url: 'https://commons.wikimedia.org/wiki/Special:FilePath/BlackMarble20161km.jpg',
  output: '16k_earth_nightmap.jpg',
  // Mostly black with point lights, so it compresses hard at this quality.
  quality: 82,
  // The app treats the night map as a lights mask on black, but the Black Marble
  // "colour" product carries a flat land background (measured at luminance ≈ 53,
  // covering ~12% of the frame) that would otherwise glow over the whole night
  // side. Reduce it to luminance and remap [levels] to [0, 255], which crushes
  // the land to black and stretches the city lights — the same look as the 8K
  // night map, which is lights-on-black.
  grayscale: true,
  levels: [50, 180],
}

/** Per-channel mean and standard deviation of a raw pixel buffer. */
function channelStats(data, channels) {
  const pixels = data.length / channels
  const mean = new Array(channels).fill(0)
  const square = new Array(channels).fill(0)
  for (let i = 0; i < data.length; i += channels) {
    for (let c = 0; c < channels; c += 1) {
      const v = data[i + c]
      mean[c] += v
      square[c] += v * v
    }
  }
  return mean.map((sum, c) => {
    const m = sum / pixels
    return { mean: m, std: Math.sqrt(Math.max(0, square[c] / pixels - m * m)) }
  })
}

/**
 * The per-channel `linear(a, b)` coefficients that restate `source` in the
 * reference's mean and spread (a standard tone match). Returns null when there
 * is no reference, or the source is flat in a channel (nothing to scale).
 */
async function matchCoefficients(sourceBuffer, sourceInfo, referenceFile, grayscale) {
  let referencePipeline = sharp(join(OUTPUT_DIR, referenceFile), { limitInputPixels: false }).resize(
    2048,
    1024,
    { fit: 'fill' },
  )
  if (grayscale) referencePipeline = referencePipeline.grayscale()
  const reference = await referencePipeline.raw().toBuffer({ resolveWithObject: true })
  const referenceStats = channelStats(reference.data, reference.info.channels)
  const sourceStats = channelStats(sourceBuffer, sourceInfo.channels)
  const a = []
  const b = []
  for (let c = 0; c < sourceInfo.channels; c += 1) {
    const ref = referenceStats[Math.min(c, referenceStats.length - 1)]
    const src = sourceStats[c]
    const gain = src.std > 1e-3 ? ref.std / src.std : 1
    a.push(gain)
    b.push(ref.mean - gain * src.mean)
  }
  return { a, b }
}

async function download(url, destination, attempt = 1) {
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)
    const partial = `${destination}.part`
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partial))
    const bytes = statSync(partial).size
    if (bytes < 1024 * 1024) throw new Error(`suspiciously small (${bytes} bytes)`)
    // Rename only after a complete download, so a failure never leaves a
    // half-written file that the next run would trust.
    if (existsSync(destination)) unlinkSync(destination)
    const { renameSync } = await import('node:fs')
    renameSync(partial, destination)
    return bytes
  } catch (error) {
    if (attempt >= 4) throw error
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
    return download(url, destination, attempt + 1)
  }
}

async function build(source) {
  const cached = join(CACHE_DIR, source.cache)
  if (!existsSync(cached)) {
    process.stdout.write(`  downloading ${source.cache} … `)
    const bytes = await download(source.url, cached)
    process.stdout.write(`${Math.round(bytes / 1024 / 1024)} MB\n`)
  } else {
    process.stdout.write(`  using cached ${source.cache}\n`)
  }

  const output = join(OUTPUT_DIR, source.output)
  process.stdout.write(`  writing ${source.output} (${WIDTH}×${HEIGHT}) … `)

  // Work out the tone-match coefficients from a small copy of the source, so the
  // full-resolution pass below only has to apply them.
  let coefficients = null
  if (source.match) {
    let small = sharp(cached, { limitInputPixels: false }).resize(2048, 1024, { fit: 'fill' })
    if (source.grayscale) small = small.grayscale()
    const { data, info } = await small.raw().toBuffer({ resolveWithObject: true })
    coefficients = await matchCoefficients(data, info, source.match, source.grayscale)
  }

  // limitInputPixels is lifted: the night source is 933 Mpx, well past libvips'
  // default ceiling, and both sources are trusted, first-party NASA products.
  let image = sharp(cached, { limitInputPixels: false }).resize(WIDTH, HEIGHT, {
    fit: 'fill',
    kernel: 'lanczos3',
  })
  if (source.grayscale) image = image.grayscale()
  if (coefficients) image = image.linear(coefficients.a, coefficients.b)
  if (source.levels) {
    // Remap [black, white] to [0, 255].
    const [black, white] = source.levels
    const gain = 255 / Math.max(1, white - black)
    image = image.linear(gain, -black * gain)
  }
  await image.jpeg({ quality: source.quality, mozjpeg: true, chromaSubsampling: '4:2:0' }).toFile(output)
  const size = statSync(output).size
  process.stdout.write(`${Math.round(size / 1024 / 1024)} MB\n`)
}

mkdirSync(OUTPUT_DIR, { recursive: true })
mkdirSync(CACHE_DIR, { recursive: true })

console.log('Solar System Explorer — 16K Earth maps\n')
await build(DAY_SOURCE)
await build(NIGHT_SOURCE)
console.log('\nDone. Files are in public/textures.')
