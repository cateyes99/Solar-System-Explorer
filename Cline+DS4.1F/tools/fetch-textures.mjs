/**
 * Downloads the real surface maps used by the Solar System Explorer.
 *
 *   node tools/fetch-textures.mjs
 *
 * The app ships these files inside `public/textures`, so a built copy still runs
 * completely offline. This script only exists so the provenance of every image is
 * written down and the assets can be re-fetched (or upgraded) on demand.
 *
 * Source: Solar System Scope (https://www.solarsystemscope.com/textures/),
 * released under CC BY 4.0. Their maps are processed from NASA / JPL / USGS
 * imagery (Blue Marble, MESSENGER, Magellan, Viking, Cassini, Voyager 2, LRO and
 * the Lunar Reconnaissance Orbiter mosaic), which is public-domain material.
 *
 * Equipment note: the maps are equirectangular (2:1), which is exactly the layout
 * a Three.js SphereGeometry expects, so no re-projection is needed.
 */
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(HERE, '..', 'public', 'textures')
const BASE = 'https://www.solarsystemscope.com/textures/download/'

/** Every map the scene can load, with the reason each one is here. */
const FILES = [
  { file: '2k_sun.jpg', body: 'Sun', note: 'Photosphere granulation (SDO/NASA imagery)' },
  { file: '2k_mercury.jpg', body: 'Mercury', note: 'MESSENGER global mosaic' },
  { file: '2k_venus_atmosphere.jpg', body: 'Venus', note: 'Cloud tops as seen by Mariner 10 / Venus Express' },
  { file: '2k_earth_daymap.jpg', body: 'Earth', note: 'Blue Marble: land, ocean and vegetation colour' },
  { file: '2k_earth_clouds.jpg', body: 'Earth clouds', note: 'Cloud-cover layer (black sky, white cloud)' },
  { file: '2k_earth_nightmap.jpg', body: 'Earth at night', note: 'City lights (NASA Black Marble)' },
  { file: '2k_moon.jpg', body: 'The Moon', note: 'LRO / Clementine albedo mosaic' },
  { file: '2k_mars.jpg', body: 'Mars', note: 'Viking / MOLA true-colour mosaic' },
  { file: '2k_jupiter.jpg', body: 'Jupiter', note: 'Cassini / Voyager belt-and-zone mosaic' },
  { file: '2k_saturn.jpg', body: 'Saturn', note: 'Cassini banded cloud deck' },
  { file: '2k_saturn_ring_alpha.png', body: 'Saturn rings', note: 'Ring optical depth with alpha (C, B, Cassini, A, F)' },
  { file: '2k_uranus.jpg', body: 'Uranus', note: 'Voyager 2 featureless methane-blue disc' },
  { file: '2k_neptune.jpg', body: 'Neptune', note: 'Voyager 2 disc with the Great Dark Spot' },
  { file: '2k_stars_milky_way.jpg', body: 'Milky Way', note: 'ESO panoramic background, unwrapped as a sky sphere' },
]

async function download(file, attempt = 1) {
  const url = `${BASE}${file}`
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    // Guard against an HTML error page quietly being saved as a texture.
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8
    const isPng = bytes.subarray(0, 4).toString('binary') === '\x89PNG'
    if (!isJpeg && !isPng) throw new Error('not a JPEG or PNG payload')
    if (bytes.length < 4096) throw new Error(`suspiciously small (${bytes.length} bytes)`)
    return bytes
  } catch (error) {
    if (attempt >= 4) throw error
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt))
    return download(file, attempt + 1)
  }
}

function describe(file) {
  const path = join(OUTPUT_DIR, file)
  if (!existsSync(path)) return 'MISSING'
  return `${Math.round(statSync(path).size / 1024)} kB`
}

mkdirSync(OUTPUT_DIR, { recursive: true })

const report = []
for (const entry of FILES) {
  const path = join(OUTPUT_DIR, entry.file)
  try {
    const bytes = await download(entry.file)
    writeFileSync(path, bytes)
    report.push({ ...entry, status: describe(entry.file), ok: true })
  } catch (error) {
    report.push({ ...entry, status: `FAILED — ${error.message}`, ok: false })
  }
}

const width = Math.max(...FILES.map((entry) => entry.file.length)) + 2
writeFileSync(
  join(OUTPUT_DIR, 'CREDITS.md'),
  [
    '# Surface map credits',
    '',
    'These images are **not** hand-drawn: they are real planetary map data.',
    '',
    '- Source: [Solar System Scope](https://www.solarsystemscope.com/textures/) textures,',
    '  licensed **CC BY 4.0**.',
    '- Derived from public-domain NASA / JPL / USGS imagery (Blue Marble, MESSENGER,',
    '  Magellan, Mariner 10, Viking, Cassini, Voyager 2, LRO, SDO, ESO).',
    '- Format: equirectangular (2:1) colour maps, plus one alpha ring strip.',
    '',
    '| File | Body | Provenance |',
    '| --- | --- | --- |',
    ...FILES.map((entry) => `| \`${entry.file}\` | ${entry.body} | ${entry.note} |`),
    '',
    'Re-fetch with `node tools/fetch-textures.mjs`. If a file is missing the app',
    'paints that body procedurally instead, so it never shows an empty planet.',
    '',
  ].join('\n'),
  'utf8',
)

console.log('Solar System Explorer — surface maps\n')
for (const entry of report) {
  console.log(`  ${entry.file.padEnd(width)} ${entry.status}`)
}
const ok = report.filter((entry) => entry.ok).length
console.log(`\n${ok}/${report.length} files ready in public/textures`)
if (ok !== report.length) process.exitCode = 1
