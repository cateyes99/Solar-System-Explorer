/**
 * Builds Earth's seafloor depth map from a real global bathymetry grid.
 *
 *   node tools/fetch-bathymetry.mjs
 *   node tools/fetch-bathymetry.mjs --download-only   # fetch the source, stop
 *   node tools/fetch-bathymetry.mjs --from <file.tif> # use a local copy
 *
 * The app ships the result inside `public/textures` as `earth_bathymetry.png`, a
 * grayscale equirectangular (2:1) depth field that `src/utils/textures.ts`
 * uploads as a raw data map and `src/components/3d/terrain.ts` reads back into
 * metres. The source grid itself is *not* committed — only this derived map is —
 * so the built app stays self-contained and runs offline.
 *
 * Source data
 * -----------
 * ETOPO 2022 (NOAA National Centers for Environmental Information), the 60
 * arc-second "bedrock" global relief model. It is a seamless fusion of measured
 * and predicted seafloor topography on a 21600 × 10800 grid of metres, and it is
 * released under **CC0-1.0** (public domain), so it can be redistributed and
 * shipped without restriction:
 *
 *   NOAA National Centers for Environmental Information. 2022: ETOPO 2022 15
 *   Arc-Second Global Relief Model. https://doi.org/10.25921/fd45-gt74
 *
 * Why 60 arc-seconds, not 15? At the 8192 × 4096 the app uploads on High, one
 * pixel is 158 arc-seconds, so a 60″ grid is already about 2.6× finer than the
 * texture can show — and the seafloor's *real* resolution is only ~6 km
 * (satellite-gravity predicted) in most of the ocean anyway. A 15″ grid would be
 * ~10× oversampled, at the cost of a 7.5 GB download instead of 456 MB. The
 * authoritative alternative is the GEBCO_2025 Grid (15″, public domain, from the
 * Nippon Foundation-GEBCO Seabed 2030 Project); ETOPO 2022 and GEBCO share the
 * same SRTM15+ ocean base, so the floor's shape is essentially the same.
 *
 * Encoding
 * --------
 *  - **0** means sea level; the seafloor descends toward **255** at `MAX_DEPTH_M`.
 *  - Land (elevation ≥ 0) is written as 0: land relief comes from the separate
 *    NASA/USGS land elevation model, and the seafloor is masked to water.
 *  - Depth is stored with a **square-root** curve so the shallow continental
 *    shelves (0–200 m, where the eye reads the most detail) get ~34 levels
 *    instead of the ~5 a linear scale would give. `src/data/visuals.ts` records
 *    the encoding, and the shader inverts it.
 *
 * The GDAL equivalent, for anyone who would rather not add the `geotiff`
 * devDependency:
 *
 *   gdal_translate -of PNG -outsize 8192 4096 -ot Byte \
 *     -scale -11000 0 255 0 ETOPO_2022_v1_60s_N90W180_bed.tif earth_bathymetry.png
 *
 * (GDAL's `-scale` is linear; the shipped map uses the sqrt curve above, which
 * `gdal_calc.py` can reproduce.)
 */
import { createWriteStream, existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { deflateSync } from 'node:zlib'
import { fromFile } from 'geotiff'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const CACHE_DIR = join(ROOT, '.cache')
const SOURCE_FILE = join(CACHE_DIR, 'etopo_2022_v1_60s_bed.tif')
const OUTPUT_FILE = join(ROOT, 'public', 'textures', 'earth_bathymetry.png')

const SOURCE_URL =
  'https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/60s/60s_bed_elev_gtif/ETOPO_2022_v1_60s_N90W180_bed.tif'

/** The shipped texture size. The quality tiers upload 8192 / 4096 / 2048 of it. */
const OUT_WIDTH = 8192
const OUT_HEIGHT = 4096

/** The depth that maps to texel 255. Near the Challenger Deep (10,935 m). */
const MAX_DEPTH_M = 11_000

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const option = (name) => {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : undefined
}

/* ------------------------------------------------------------------ download */

function human(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Resumable download. The ETOPO file is ~456 MB, so a dropped connection should
 * not mean starting again: whatever is already on disk is kept and the request
 * continues from there with a Range header.
 */
async function download(url, dest) {
  mkdirSync(CACHE_DIR, { recursive: true })
  const head = await fetch(url, { method: 'HEAD' })
  if (!head.ok) throw new Error(`HEAD ${url} → HTTP ${head.status}`)
  const total = Number(head.headers.get('content-length'))
  if (!Number.isFinite(total) || total <= 0) throw new Error('could not read the source size')

  let start = existsSync(dest) ? statSync(dest).size : 0
  if (start > total) {
    unlinkSync(dest)
    start = 0
  }
  if (start === total) {
    console.log(`  source already downloaded (${human(total)})`)
    return dest
  }

  console.log(`  downloading ${human(total)} from NOAA NCEI…`)
  const response = await fetch(url, { headers: start > 0 ? { Range: `bytes=${start}-` } : {} })
  if (!response.ok || !response.body) throw new Error(`GET ${url} → HTTP ${response.status}`)
  const file = createWriteStream(dest, { flags: start > 0 ? 'a' : 'w' })

  let received = start
  let lastLog = Date.now()
  const body = Readable.fromWeb(response.body)
  body.on('data', (chunk) => {
    received += chunk.length
    if (Date.now() - lastLog > 2000) {
      lastLog = Date.now()
      const pct = ((received / total) * 100).toFixed(1)
      process.stdout.write(`\r  ${pct}%  ${human(received)} / ${human(total)}   `)
    }
  })
  await pipeline(body, file)
  process.stdout.write('\r')

  if (statSync(dest).size !== total) throw new Error(`incomplete download (${statSync(dest).size} of ${total})`)
  console.log(`  downloaded ${human(total)}`)
  return dest
}

/* --------------------------------------------------------------------- PNG */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typed = Buffer.from(type, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typed, data])), 0)
  return Buffer.concat([length, typed, data, crc])
}

/** 8-bit grayscale PNG. Rows use the "Sub" filter, which suits a smooth field. */
function encodeGrayPng(pixels, width, height) {
  const raw = Buffer.alloc(height * (1 + width))
  for (let y = 0; y < height; y += 1) {
    const row = y * width
    const out = y * (1 + width)
    raw[out] = 1 // Sub filter
    raw[out + 1] = pixels[row]
    for (let x = 1; x < width; x += 1) raw[out + 1 + x] = (pixels[row + x] - pixels[row + x - 1]) & 0xff
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 0 // colour type: grayscale
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ resample */

/**
 * Box-averages the source grid down to the shipped size and encodes depth.
 * The ETOPO grid and the output are both plain equirectangular (−180…180,
 * 90…−90, north up), so no reprojection is needed — only a scale.
 */
function resampleAndEncode(elevation, srcWidth, srcHeight) {
  const pixels = new Uint8Array(OUT_WIDTH * OUT_HEIGHT)
  const scaleX = srcWidth / OUT_WIDTH
  const scaleY = srcHeight / OUT_HEIGHT
  let deepest = 0
  for (let oy = 0; oy < OUT_HEIGHT; oy += 1) {
    const y0 = Math.floor(oy * scaleY)
    const y1 = Math.max(y0 + 1, Math.floor((oy + 1) * scaleY))
    for (let ox = 0; ox < OUT_WIDTH; ox += 1) {
      const x0 = Math.floor(ox * scaleX)
      const x1 = Math.max(x0 + 1, Math.floor((ox + 1) * scaleX))
      let sum = 0
      let count = 0
      for (let y = y0; y < y1; y += 1) {
        const row = y * srcWidth
        for (let x = x0; x < x1; x += 1) {
          const value = elevation[row + x]
          // noData and any other non-finite sample means "no water here".
          sum += Number.isFinite(value) && value > -100000 ? value : 0
          count += 1
        }
      }
      const average = count > 0 ? sum / count : 0
      // Land (and the coastline) is written as sea level; the seafloor is masked
      // to water and the land relief comes from the separate land elevation model.
      const depth = average < 0 ? Math.min(-average, MAX_DEPTH_M) : 0
      if (depth > deepest) deepest = depth
      // sqrt curve: texel = 255 · sqrt(depth / max)
      pixels[oy * OUT_WIDTH + ox] = Math.min(255, Math.round(255 * Math.sqrt(depth / MAX_DEPTH_M)))
    }
  }
  return { pixels, deepest }
}

/* ---------------------------------------------------------------------- run */

async function main() {
  console.log('Earth bathymetry — ETOPO 2022 (60 arc-second, CC0)')

  const local = option('--from')
  let sourcePath = local ?? SOURCE_FILE
  if (flag('--download-only')) {
    await download(SOURCE_URL, SOURCE_FILE)
    console.log('Done (download only). Re-run without --download-only to build the map.')
    return
  }
  if (!local) sourcePath = await download(SOURCE_URL, SOURCE_FILE)
  if (!existsSync(sourcePath)) throw new Error(`source not found: ${sourcePath}`)

  console.log('  reading the grid…')
  const tiff = await fromFile(sourcePath)
  const image = await tiff.getImage()
  const width = image.getWidth()
  const height = image.getHeight()
  const raster = await image.readRasters({ interleave: true })

  console.log(`  resampling ${width}×${height} → ${OUT_WIDTH}×${OUT_HEIGHT}…`)
  const { pixels, deepest } = resampleAndEncode(raster, width, height)

  console.log('  encoding the PNG…')
  const png = encodeGrayPng(pixels, OUT_WIDTH, OUT_HEIGHT)
  mkdirSync(dirname(OUTPUT_FILE), { recursive: true })
  writeFileSync(OUTPUT_FILE, png)

  console.log(`  wrote ${OUTPUT_FILE} (${human(png.length)})`)
  console.log(`  deepest water in the map: ${Math.round(deepest)} m (clamped at ${MAX_DEPTH_M} m)`)
  console.log('')
  console.log('Attribution (already recorded in public/textures/CREDITS.md):')
  console.log(
    '  NOAA National Centers for Environmental Information. 2022: ETOPO 2022 60 Arc-Second Bedrock Relief Model.',
  )
  console.log('  https://doi.org/10.25921/fd45-gt74  (CC0-1.0)')
  console.log('')
  console.log('Reminder: roughly three-quarters of the seafloor here is PREDICTED from')
  console.log('satellite gravity, not directly measured — do not present it as survey data.')
}

main().catch((error) => {
  console.error(`\nfetch-bathymetry failed: ${error.message}`)
  process.exitCode = 1
})
