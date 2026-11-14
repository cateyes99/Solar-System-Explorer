/**
 * Downloads the Natural Earth vector data behind the optional "World map"
 * overlay — national boundaries, regional (state/province) boundaries, capitals
 * and major cities — and writes compact, ready-to-serve JSON into
 * `public/geo`.
 *
 *   node tools/fetch-geo.mjs
 *
 * The app ships these files inside `public/geo`, so a built copy still runs
 * completely offline. This script only exists so the provenance is written down
 * and the data can be re-fetched (or upgraded) on demand.
 *
 * Source: [Natural Earth](https://www.naturalearthdata.com/), from the project's
 * own vector repository (`nvkelso/natural-earth-vector`, the GeoJSON mirror of
 * the official shapefiles). Natural Earth is **public domain**: "No permission is
 * needed to use Natural Earth. Crediting the authors is unnecessary." The vector
 * data is derived from public-domain and openly licensed sources and is the
 * de-facto standard cartographic reference for web maps.
 *
 * National borders and cities are produced at two detail levels, matching the
 * app's quality tiers: 1:110m for the low tier and 1:50m for medium and high.
 * Regional (state/province) borders come from the 1:10m set, because it is the
 * only scale at which Natural Earth publishes internal boundaries worldwide —
 * the 1:50m and 1:110m line themes cover just four countries. The raw GeoJSON
 * carries far more attributes than the scene uses, so only the coordinates and
 * the handful of fields below are kept.
 *
 * Output formats (all equirectangular WGS84, longitude first):
 *
 *  - `borders-*.json` / `regions.json`
 *      `{ "lines": [ [lon, lat, lon, lat, …], … ] }`
 *    Each entry is one polyline, flattened to a single array of pairs so the
 *    file stays small. Lines are already split at the antimeridian by Natural
 *    Earth; the guard below splits any remaining ±180° jump so a segment can
 *    never be drawn the long way round the globe.
 *
 *  - `places-*.json`
 *      `{ "places": [ { name, zh, lon, lat, cap, pop, rank, label, tier }, … ] }`
 *    `name` is the ASCII (English) place name and `zh` its Simplified Chinese
 *    name from Natural Earth's `NAME_ZH` (empty when the source has none, and the
 *    scene then falls back to `name`). `cap` is 1 for a national capital, `pop`
 *    is the metro population estimate and `rank` is Natural Earth's importance
 *    rank (0 = most important). `label` marks the subset important enough to show
 *    a text label next to its marker, and `tier` splits those into 0 (named from
 *    the first close-up) and 1 (named once the viewer zooms in further).
 */
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(HERE, '..', 'public', 'geo')
const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'

/**
 * How many of the largest *non-capital* cities also get a text label. Every
 * national capital is labelled regardless (there are about two hundred), and
 * this adds the biggest cities on top, so the map names capitals and major
 * cities rather than capitals alone.
 */
const EXTRA_CITY_LABELS = 60

/**
 * How many of the most important places are named from the first close-up. The
 * rest are held back for a second, closer tier: a globe a third of the screen
 * across can carry a few dozen names, not two hundred, and the viewer who wants
 * the small capitals can zoom in for them.
 */
const PRIMARY_LABELS = 60

/**
 * Natural Earth's importance rank (`LABELRANK`, 1 = most important) at or below
 * which a country is named from the first close-up. The rest wait for a second,
 * closer tier, exactly as the cities do — a globe a third of the screen across
 * cannot carry two hundred country names at once.
 */
const COUNTRY_PRIMARY_RANK = 4

const SOURCES = [
  { file: 'borders-110.json', source: 'ne_110m_admin_0_boundary_lines_land.geojson', kind: 'lines', label: 'National borders (1:110m)' },
  { file: 'borders-50.json', source: 'ne_50m_admin_0_boundary_lines_land.geojson', kind: 'lines', label: 'National borders (1:50m)' },
  { file: 'countries-110.json', source: 'ne_110m_admin_0_countries.geojson', kind: 'countries', label: 'Country names (1:110m)' },
  { file: 'countries-50.json', source: 'ne_50m_admin_0_countries.geojson', kind: 'countries', label: 'Country names (1:50m)' },
  {
    file: 'regions.json',
    source: 'ne_10m_admin_1_states_provinces_lines.geojson',
    kind: 'lines',
    label: 'Regional borders (1:10m, worldwide)',
    // ~1 km: invisible on a globe, and it cuts the shipped file by ~80%.
    simplify: 0.01,
  },
  // The full (not "simple") populated-places files are used because they are the
  // ones that carry the localized name columns — `NAME_ZH` is what lets the city
  // labels follow the interface language. Only a handful of fields are kept, so
  // the shipped files stay small.
  { file: 'places-110.json', source: 'ne_110m_populated_places.geojson', kind: 'places', label: 'Capitals and cities (1:110m)' },
  { file: 'places-50.json', source: 'ne_50m_populated_places.geojson', kind: 'places', label: 'Capitals and cities (1:50m)' },
]

/** Rounds to four decimals (~11 m) — finer than any globe can show. */
const round4 = (value) => Math.round(value * 1e4) / 1e4

/**
 * Douglas–Peucker line simplification, in degrees. A border digitised at survey
 * resolution carries far more vertices than a globe can ever show, so any point
 * lying within `tolerance` of the straight line between the points that are kept
 * is dropped. It is run only on the dense 1:10m regional set.
 */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  const toleranceSq = tolerance * tolerance
  while (stack.length > 0) {
    const [first, last] = stack.pop()
    const ax = points[first][0]
    const ay = points[first][1]
    const dx = points[last][0] - ax
    const dy = points[last][1] - ay
    const lenSq = dx * dx + dy * dy
    let maxDistSq = 0
    let index = -1
    for (let i = first + 1; i < last; i += 1) {
      const ex = points[i][0] - ax
      const ey = points[i][1] - ay
      let distSq
      if (lenSq === 0) {
        distSq = ex * ex + ey * ey
      } else {
        const t = Math.max(0, Math.min(1, (ex * dx + ey * dy) / lenSq))
        const cx = ex - t * dx
        const cy = ey - t * dy
        distSq = cx * cx + cy * cy
      }
      if (distSq > maxDistSq) {
        maxDistSq = distSq
        index = i
      }
    }
    if (maxDistSq > toleranceSq && index > 0) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  const out = []
  for (let i = 0; i < points.length; i += 1) if (keep[i]) out.push(points[i])
  return out
}

/**
 * Splits one coordinate ring into runs of `[lon, lat]` pairs, dropping repeated
 * points. A jump of 180° or more in longitude is the antimeridian, so the ring
 * is cut there rather than drawn across the whole planet.
 */
function splitRing(coordinates) {
  const runs = []
  let run = []
  let previousLon = null
  for (const point of coordinates) {
    const lon = point[0]
    const lat = point[1]
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    if (previousLon !== null && Math.abs(lon - previousLon) > 180) {
      if (run.length >= 2) runs.push(run)
      run = []
    }
    const last = run[run.length - 1]
    if (!last || last[0] !== lon || last[1] !== lat) run.push([lon, lat])
    previousLon = lon
  }
  if (run.length >= 2) runs.push(run)
  return runs
}

/** Simplifies a run and flattens it to `[lon, lat, lon, lat, …]` at 3 decimals. */
function flattenRun(points, tolerance) {
  const kept = tolerance > 0 ? simplify(points, tolerance) : points
  const out = []
  for (const [lon, lat] of kept) {
    out.push(Math.round(lon * 1e3) / 1e3, Math.round(lat * 1e3) / 1e3)
  }
  return out
}

function collectRuns(geometry) {
  if (!geometry) return []
  switch (geometry.type) {
    case 'LineString':
      return splitRing(geometry.coordinates)
    case 'MultiLineString':
      return geometry.coordinates.flatMap((ring) => splitRing(ring))
    case 'Polygon':
      return geometry.coordinates.flatMap((ring) => splitRing(ring))
    case 'MultiPolygon':
      return geometry.coordinates.flatMap((polygon) => polygon.flatMap((ring) => splitRing(ring)))
    default:
      return []
  }
}

/** Reads a property whichever case the source uses. */
function prop(properties, ...names) {
  for (const name of names) {
    if (properties[name] !== undefined && properties[name] !== null) return properties[name]
  }
  return undefined
}

function buildLines(geojson, tolerance = 0) {
  const lines = []
  for (const feature of geojson.features ?? []) {
    for (const run of collectRuns(feature.geometry)) {
      const flat = flattenRun(run, tolerance)
      if (flat.length >= 4) lines.push(flat)
    }
  }
  return { lines }
}

function buildPlaces(geojson) {
  const places = []
  for (const feature of geojson.features ?? []) {
    const properties = feature.properties ?? {}
    const name = String(prop(properties, 'NAMEASCII', 'nameascii', 'NAME', 'name') ?? '').trim()
    if (!name) continue
    // The Simplified Chinese name, so the city labels can follow the interface
    // language. Falls back to the English name when the source has none.
    const zh = String(prop(properties, 'NAME_ZH', 'name_zh') ?? '').trim()
    const coords = feature.geometry?.coordinates ?? []
    const lon = Number(prop(properties, 'LONGITUDE', 'longitude') ?? coords[0])
    const lat = Number(prop(properties, 'LATITUDE', 'latitude') ?? coords[1])
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    const cap = Number(prop(properties, 'ADM0CAP', 'adm0cap') ?? 0) === 1 ? 1 : 0
    const pop = Math.max(0, Math.round(Number(prop(properties, 'POP_MAX', 'pop_max') ?? 0) || 0))
    const rank = Math.max(0, Math.round(Number(prop(properties, 'SCALERANK', 'scalerank') ?? 10) || 0))
    places.push({ name, zh, lon: round4(lon), lat: round4(lat), cap, pop, rank, label: 0, tier: 1 })
  }
  // Label every national capital, plus the largest cities that are not capitals.
  const cities = places
    .filter((place) => place.cap === 0)
    .sort((a, b) => b.pop - a.pop || a.rank - b.rank)
  for (const place of places) place.label = place.cap
  for (let i = 0; i < Math.min(EXTRA_CITY_LABELS, cities.length); i += 1) cities[i].label = 1

  // The labelled places are split into two importance tiers. A capital is
  // boosted so a country's seat is named even when its metro is small.
  const importance = (place) => place.pop * (place.cap === 1 ? 1.4 : 1)
  const ranked = places
    .filter((place) => place.label === 1)
    .sort((a, b) => importance(b) - importance(a))
  for (let i = 0; i < ranked.length; i += 1) ranked[i].tier = i < PRIMARY_LABELS ? 0 : 1
  return { places }
}

/**
 * Country name labels. The position is Natural Earth's designed label point
 * (`LABEL_X`/`LABEL_Y`), not a centroid, so the name sits where a cartographer
 * would put it; the localized name and the importance rank ride along so the
 * labels follow the interface language and arrive in two tiers like the cities.
 */
function buildCountries(geojson) {
  const countries = []
  for (const feature of geojson.features ?? []) {
    const properties = feature.properties ?? {}
    const name = String(prop(properties, 'NAME', 'name', 'ADMIN', 'admin') ?? '').trim()
    if (!name) continue
    const zh = String(prop(properties, 'NAME_ZH', 'name_zh') ?? '').trim()
    const lon = Number(prop(properties, 'LABEL_X', 'label_x'))
    const lat = Number(prop(properties, 'LABEL_Y', 'label_y'))
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    const rank = Math.max(0, Math.round(Number(prop(properties, 'LABELRANK', 'labelrank') ?? 10) || 0))
    countries.push({
      name,
      zh,
      lon: round4(lon),
      lat: round4(lat),
      rank,
      tier: rank <= COUNTRY_PRIMARY_RANK ? 0 : 1,
    })
  }
  return { countries }
}

async function download(url, attempt = 1) {
  try {
    const response = await fetch(url, { redirect: 'follow' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    if (attempt >= 4) throw error
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt))
    return download(url, attempt + 1)
  }
}

function describe(file) {
  const path = join(OUTPUT_DIR, file)
  if (!existsSync(path)) return 'MISSING'
  return `${Math.round(statSync(path).size / 1024)} kB`
}

mkdirSync(OUTPUT_DIR, { recursive: true })

const report = []
for (const entry of SOURCES) {
  const path = join(OUTPUT_DIR, entry.file)
  try {
    const geojson = await download(`${BASE}${entry.source}`)
    const data =
      entry.kind === 'lines'
        ? buildLines(geojson, entry.simplify ?? 0)
        : entry.kind === 'countries'
          ? buildCountries(geojson)
          : buildPlaces(geojson)
    writeFileSync(path, JSON.stringify(data))
    const count =
      entry.kind === 'lines'
        ? `${data.lines.length} lines`
        : entry.kind === 'countries'
          ? `${data.countries.length} countries`
          : `${data.places.length} places`
    report.push({ ...entry, status: `${describe(entry.file)} (${count})`, ok: true })
  } catch (error) {
    report.push({ ...entry, status: `FAILED — ${error.message}`, ok: false })
  }
}

const width = Math.max(...SOURCES.map((entry) => entry.file.length)) + 2
writeFileSync(
  join(OUTPUT_DIR, 'CREDITS.md'),
  [
    '# World map data credits',
    '',
    'The optional **World map** layer (national boundaries, regional boundaries,',
    'country names, capitals and major cities) is built from **Natural Earth**',
    'vector data.',
    '',
    '- Source: [Natural Earth](https://www.naturalearthdata.com/), from the',
    '  project’s own vector repository (`nvkelso/natural-earth-vector`).',
    '- Licence: **public domain** — "No permission is needed to use Natural Earth.',
    '  Crediting the authors is unnecessary." Attribution is given here anyway.',
    '- Layers: `admin_0_boundary_lines_land` (national borders),',
    '  `admin_1_states_provinces_lines` (regional borders), `admin_0_countries`',
    '  (country names and their label points) and `populated_places` (capitals and',
    '  cities).',
    '- Projection: WGS84 geographic (longitude/latitude), the same equirectangular',
    '  layout as the surface maps, so the overlay lines up with the continents.',
    '- Place names carry Natural Earth’s localized names (`NAME_ZH`), so the city',
    '  labels follow the interface language; the English/ASCII name is kept as a',
    '  fallback for any place without one.',
    '- National borders and cities ship at two detail levels: 1:110m (low graphics',
    '  tier) and 1:50m (medium and high). Regional borders ship at 1:10m, the only',
    '  scale with worldwide coverage. Regenerate with `node tools/fetch-geo.mjs`.',
    '- Country and city names ship in English and Simplified Chinese (Natural',
    '  Earth’s `NAME_ZH`), so the map labels follow the interface language.',
    '',
    '## Files',
    '',
    '| File | Contents |',
    '| --- | --- |',
    ...SOURCES.map((entry) => `| \`${entry.file}\` | ${entry.label} |`),
    '',
    'City population figures are Natural Earth\'s metro-area estimates, used only',
    'to rank and size the markers; they are not census data.',
    '',
  ].join('\n'),
  'utf8',
)

console.log('Solar System Explorer — world map data\n')
for (const entry of report) {
  console.log(`  ${entry.file.padEnd(width)} ${entry.status}`)
}
const ok = report.filter((entry) => entry.ok).length
console.log(`\n${ok}/${report.length} files ready in public/geo`)
if (ok !== report.length) process.exitCode = 1
