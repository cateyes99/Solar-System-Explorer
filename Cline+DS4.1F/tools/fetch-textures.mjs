/**
 * Downloads the real surface maps used by the Solar System Explorer.
 *
 *   node tools/fetch-textures.mjs
 *
 * The app ships these files inside `public/textures`, so a built copy still runs
 * completely offline. This script only exists so the provenance of every image is
 * written down and the assets can be re-fetched (or upgraded) on demand.
 *
 * Sources:
 *
 *  - Solar System Scope (https://www.solarsystemscope.com/textures/), released
 *    under CC BY 4.0. Their maps are processed from NASA / JPL / USGS imagery
 *    (Blue Marble, MESSENGER, Magellan, Viking, Cassini, Voyager 2, LRO and the
 *    Lunar Reconnaissance Orbiter mosaic), which is public-domain material.
 *  - Earth's elevation model, from Wikimedia Commons (public domain, NASA /
 *    USGS SRTM–GTOPO30 relief). It is the one map here that is not a colour
 *    photograph; see below.
 *
 * Earth's day and night maps are fetched at Solar System Scope's "ultra"
 * resolution, 8192×4096, rather than the 2K the rest of the set uses: they carry
 * the surface a viewer inspects most closely — the coastlines and terrain colour
 * by day, the city lights by night. They are the same product as the 2K maps —
 * identical projection, colour and geographic alignment — so they drop straight
 * onto the existing terrain geometry and texture offsets.
 * `src/utils/textureResolution.ts` uploads each at 8K / 4K / 2K by quality tier,
 * so the extra resolution is only spent when it is asked for.
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

/**
 * Earth's elevation model, which is not part of the Solar System Scope set.
 *
 * It is the NASA / USGS global relief map that Wikipedia's "Elevation" article
 * uses: GTOPO30 / SRTM land elevation, normalised to 8-bit grayscale with sea
 * level at #0c0c0c. It comes from Wikimedia Commons (public domain — NASA
 * material).
 *
 * The original is 21600×10800 and 6 MB, which is more than the whole rest of the
 * texture set put together; the `width` query asks Wikimedia for its 3840×1920
 * rendition (283 kB) instead, which is still twice the density the app uploads
 * (see `TEXTURE_MAX_WIDTH` in `src/utils/textures.ts`). The encoding — sea level
 * texel 12, highest land texel 218 — is recorded in `src/data/visuals.ts`, so
 * the renderer reads the real heights back out.
 */
const HEIGHTMAP_URL =
  'https://commons.wikimedia.org/wiki/Special:FilePath/Srtm_ramp2.world.21600x10800.jpg?width=3840'

/** Every map the scene can load, with the reason each one is here. */
const FILES = [
  { file: '2k_sun.jpg', body: 'Sun', note: 'Photosphere granulation (SDO/NASA imagery)' },
  { file: '2k_mercury.jpg', body: 'Mercury', note: 'MESSENGER global mosaic' },
  { file: '2k_venus_atmosphere.jpg', body: 'Venus', note: 'Cloud tops as seen by Mariner 10 / Venus Express' },
  {
    file: '8k_earth_daymap.jpg',
    body: 'Earth',
    note: 'Blue Marble: land, ocean and vegetation colour (8192×4096)',
  },
  {
    file: 'earth_heightmap.jpg',
    body: 'Earth elevation',
    note: 'NASA / USGS SRTM–GTOPO30 global relief (public domain), sea level at #0c0c0c',
    url: HEIGHTMAP_URL,
  },
  {
    // Not downloaded here: built from the ETOPO 2022 bathymetry grid by
    // `tools/fetch-bathymetry.mjs`, which needs the `geotiff` devDependency.
    // It is listed so the credits table stays complete.
    file: 'earth_bathymetry.png',
    body: 'Earth seafloor',
    note: 'ETOPO 2022 60″ bedrock relief (NOAA NCEI, CC0-1.0), normalised to 8-bit depth',
    generated: true,
  },
  { file: '2k_earth_clouds.jpg', body: 'Earth clouds', note: 'Cloud-cover layer (black sky, white cloud)' },
  {
    file: '8k_earth_nightmap.jpg',
    body: 'Earth at night',
    note: 'City lights (NASA Black Marble), 8192×4096',
  },
  { file: '2k_moon.jpg', body: 'The Moon', note: 'LRO / Clementine albedo mosaic' },
  { file: '2k_mars.jpg', body: 'Mars', note: 'Viking / MOLA true-colour mosaic' },
  { file: '2k_jupiter.jpg', body: 'Jupiter', note: 'Cassini / Voyager belt-and-zone mosaic' },
  { file: '2k_saturn.jpg', body: 'Saturn', note: 'Cassini banded cloud deck' },
  { file: '2k_saturn_ring_alpha.png', body: 'Saturn rings', note: 'Ring optical depth with alpha (C, B, Cassini, A, F)' },
  { file: '2k_uranus.jpg', body: 'Uranus', note: 'Voyager 2 featureless methane-blue disc' },
  { file: '2k_neptune.jpg', body: 'Neptune', note: 'Voyager 2 disc with the Great Dark Spot' },
  {
    file: '2k_pluto.jpg',
    body: 'Pluto',
    note: 'NASA New Horizons global colour mosaic (public domain); far south filled in',
    // New Horizons swept past so fast that it never imaged Pluto's far south, so
    // the raw encounter mosaic (Wikimedia Commons, “Pluto color mapmosaic.jpg”)
    // carries a black southern band. The shipped map has that band filled in to
    // make a complete globe — so this script must never overwrite it with the
    // raw file. Marked `skip` for that reason.
    skip: true,
  },
  { file: '2k_stars_milky_way.jpg', body: 'Milky Way', note: 'ESO panoramic background, unwrapped as a sky sphere' },
]

async function download(entry, attempt = 1) {
  // Most maps live on one host, so the entry usually carries only a file name;
  // the elevation model has a `url` of its own.
  const url = entry.url ?? `${BASE}${entry.file}`
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
    return download(entry, attempt + 1)
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
  // A composited map (Pluto) is left exactly as it ships: re-downloading it would
  // bring back the un-imaged band the shipped file works around.
  if (entry.skip || entry.generated) {
    report.push({
      ...entry,
      status: `${describe(entry.file)} (${
        entry.generated ? 'generated by tools/fetch-bathymetry.mjs' : 'composited, kept'
      })`,
      ok: true,
    })
    continue
  }
  const path = join(OUTPUT_DIR, entry.file)
  try {
    const bytes = await download(entry)
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
    '- Format: equirectangular (2:1) colour maps, plus one alpha ring strip and one',
    '  grayscale height field.',
    '- `8k_earth_daymap.jpg` and `8k_earth_nightmap.jpg` are Solar System Scope’s',
    '  “ultra resolution” Earth maps, 8192×4096 — four times the width of the 2K maps',
    '  they replaced. They are the same product (identical projection, colour and',
    '  geographic alignment), so they line up exactly with each other, with the',
    '  elevation model and with every texture offset. The app uploads each at 8K on',
    '  High, 4K on Medium and 2K on Low quality, and never above the GPU’s maximum',
    '  texture size.',
    '- `earth_heightmap.jpg` is not from Solar System Scope: it is the public-domain',
    '  NASA / USGS SRTM–GTOPO30 global relief map, published by Wikimedia Commons,',
    '  normalised to 8-bit grayscale with sea level at `#0c0c0c`. The app reads that',
    '  encoding (sea level texel 12, highest land texel 218) back into metres to',
    '  displace Earth’s surface; it is 3840×1920 and is downscaled on upload.',
    '- `earth_bathymetry.png` is a grayscale *depth* field built from the',
    '  public-domain ETOPO 2022 60 arc-second bedrock relief model (NOAA NCEI,',
    '  CC0-1.0, https://doi.org/10.25921/fd45-gt74). It is generated by',
    '  `tools/fetch-bathymetry.mjs` and is not re-downloaded here. Roughly',
    '  three-quarters of the seafloor it shows is predicted from satellite gravity',
    '  rather than directly surveyed.',
    '- Pluto’s map is the public-domain NASA / JHUAPL / SwRI New Horizons global',
    '  colour mosaic, with the southern band New Horizons never imaged filled in to',
    '  complete the globe. It is composited rather than downloaded, so the fetch',
    '  script leaves it untouched.',
    '',
    '| File | Body | Provenance |',
    '| --- | --- | --- |',
    ...FILES.map((entry) => `| \`${entry.file}\` | ${entry.body} | ${entry.note} |`),
    '',
    '## Maps the app works out for itself',
    '',
    'These have no downloaded file: they are built in the browser from the map above',
    'or from published measurements.',
    '',
    '- `earthRoughness` — ocean-versus-land roughness, derived from the day map. Glassy water',
    '  and dusty land are what put the sun glint on the oceans.',
    '- `uranusRings` — Uranus’s nine narrow rings and its dust sheet, drawn from their published',
    '  radii and normal optical depths (PDS Ring-Moon Systems Node: Showalter & Lissauer 2006;',
    '  Nicholson et al. 2018). No calibrated Voyager ring strip is available in this map set, so',
    '  the measured geometry is painted rather than faked with Saturn’s bands.',
    '- The Sun’s corona, star and comet sprites — soft glows with no photographic counterpart.',
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
