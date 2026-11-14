import type { QualityLevel } from '../types'

/**
 * The optional "World map" overlay's vector data.
 *
 * The files live in `public/geo` (see `tools/fetch-geo.mjs` and
 * `public/geo/CREDITS.md`) and are real Natural Earth data — public domain —
 * rather than hand-drawn: national borders, regional (state/province) borders,
 * capitals and major cities. They are fetched the first time the layer is turned
 * on and cached for the session, so a viewer who never opens the map never pays
 * for it.
 *
 * Everything here is deliberately pure: no Three.js and no DOM. The projection
 * and the geometry builders are unit-tested (see `tests/geo.test.ts`), and the
 * rendering components own the shaders and the objects.
 */

/** One polyline as a flat `[lon, lat, lon, lat, …]` array. */
export type GeoLine = number[]

export interface GeoLines {
  lines: GeoLine[]
}

export interface GeoPlace {
  /** The English/ASCII place name (Natural Earth's `NAMEASCII`). */
  name: string
  /**
   * The Simplified Chinese name (Natural Earth's `NAME_ZH`), or an empty string
   * when the source has none. `placeName` falls back to `name` for those.
   */
  zh: string
  lon: number
  lat: number
  /** 1 for a national capital, 0 otherwise. */
  cap: number
  /** Metro population estimate, used only to size the marker. */
  pop: number
  /** Natural Earth importance rank; 0 is the most important. */
  rank: number
  /** 1 when the place is important enough to carry a text label. */
  label: number
  /**
   * Label importance: 0 for the biggest places, named from the first close-up,
   * and 1 for the rest, named once the viewer zooms in further. Meaningless when
   * `label` is 0.
   */
  tier: number
}

export interface GeoPlaces {
  places: GeoPlace[]
}

/**
 * One country name label: where to put it, what to call it, and how important
 * it is. The position is Natural Earth's designed label point, not a centroid.
 */
export interface GeoCountry {
  /** The English/ASCII name (Natural Earth's `NAME`). */
  name: string
  /** The Simplified Chinese name, or an empty string; `countryName` falls back. */
  zh: string
  lon: number
  lat: number
  /** Natural Earth's importance rank, 1 = most important. */
  rank: number
  /** 0 for the countries named from the first close-up, 1 for the rest. */
  tier: number
}

export interface GeoCountries {
  countries: GeoCountry[]
}

const TWO_PI = Math.PI * 2

/**
 * The two shipped detail levels. The low tier gets the coarse 1:110m data and
 * everything else the 1:50m set, mirroring how the quality tiers spend texture
 * resolution.
 */
function tierSuffix(quality: QualityLevel): '110' | '50' {
  return quality === 'low' ? '110' : '50'
}

function geoUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.endsWith('/') ? base : `${base}/`}geo/${file}`
}

/** One in-flight (or finished) fetch per file, so a re-mount never refetches. */
const cache = new Map<string, Promise<unknown>>()

function loadJson<T>(file: string): Promise<T> {
  const existing = cache.get(file)
  if (existing) return existing as Promise<T>
  const promise = fetch(geoUrl(file))
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load ${file} (HTTP ${response.status})`)
      return response.json() as Promise<T>
    })
    .catch((error: unknown) => {
      // A failed load must not be cached, or the layer could never recover.
      cache.delete(file)
      throw error
    })
  cache.set(file, promise)
  return promise
}

export function loadBorders(quality: QualityLevel): Promise<GeoLines> {
  return loadJson<GeoLines>(`borders-${tierSuffix(quality)}.json`)
}

export function loadRegions(): Promise<GeoLines> {
  return loadJson<GeoLines>('regions.json')
}

export function loadPlaces(quality: QualityLevel): Promise<GeoPlaces> {
  return loadJson<GeoPlaces>(`places-${tierSuffix(quality)}.json`)
}

export function loadCountries(quality: QualityLevel): Promise<GeoCountries> {
  return loadJson<GeoCountries>(`countries-${tierSuffix(quality)}.json`)
}

/**
 * The unit-sphere direction a longitude/latitude maps to on the surface.
 *
 * The surface material samples the day map at `(sphereUv + offset)` (see
 * `data/visuals.ts`, `textureOffsetU`), so a vertex whose texel sits at the map
 * coordinate for `lon` must be placed at `sphereUv.x = mapU − offset` for the
 * vector to land on the same continent the texture paints. The vertical axis is
 * simpler: `SphereGeometry`'s `uv.y` is 1 at the north pole, and the equirect
 * map's own v is 0 there, which the texture's `flipY` reconciles.
 *
 * The result is a point on the unit sphere, ready to be scaled by the planet's
 * drawn radius. It matches the day map exactly, which is what keeps a border on
 * the ground it belongs to.
 */
export function lonLatToDirection(lon: number, lat: number, uvOffsetU: number): [number, number, number] {
  const theta = ((90 - lat) / 180) * Math.PI
  const phi = (((lon + 180) / 360 - uvOffsetU) % 1) * TWO_PI
  const sinTheta = Math.sin(theta)
  return [-Math.cos(phi) * sinTheta, Math.cos(theta), Math.sin(phi) * sinTheta]
}

/**
 * Subdivides long border segments so the overlay follows the terrain.
 *
 * The overlay is a run of straight segments between its vertices, and a straight
 * chord cuts through whatever the ground does between them. That is invisible on
 * Natural Earth's dense coastlines, but not on the sparse regional lines:
 * Greenland's municipal boundaries ship as a handful of points spanning the whole
 * ice sheet, so at high relief each long segment is buried in its middle and only
 * the bits near its endpoints survive — the line comes apart into dashes. Cutting
 * every segment longer than `maxStepDegrees` keeps each chord on the ground the
 * shader displaces it to. The step is a true arc (a degree of longitude shrinks
 * toward the poles) and is a fraction of the surface mesh's own cell, so a
 * sub-segment never spans much more than a single facet.
 */
export function densifyLines(lines: GeoLine[], maxStepDegrees = 0.25): GeoLine[] {
  const out: GeoLine[] = []
  for (const line of lines) {
    const points = line.length >> 1
    if (points < 2) {
      out.push(line)
      continue
    }
    const dense: number[] = [line[0], line[1]]
    let previousLon = line[0]
    let previousLat = line[1]
    for (let i = 1; i < points; i += 1) {
      const lon = line[i * 2]
      const lat = line[i * 2 + 1]
      const dLat = lat - previousLat
      const dLon = (lon - previousLon) * Math.cos((lat * Math.PI) / 180)
      const steps = Math.max(1, Math.ceil(Math.hypot(dLat, dLon) / maxStepDegrees))
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps
        dense.push(previousLon + (lon - previousLon) * t, previousLat + (lat - previousLat) * t)
      }
      previousLon = lon
      previousLat = lat
    }
    out.push(dense)
  }
  return out
}

/** How many line segments a set of polylines becomes (each has n−1 segments). */
export function countSegments(lines: GeoLine[]): number {
  let total = 0
  for (const line of lines) total += Math.max(0, (line.length >> 1) - 1)
  return total
}

/**
 * Builds one `LineSegments2` position buffer for every border polyline.
 *
 * The output is the flat `[startX, startY, startZ, endX, endY, endZ, …]` layout
 * `LineSegmentsGeometry.setPositions` expects, holding *unit-sphere directions*:
 * the terrain displacement is applied later, in the vertex shader, so moving the
 * relief slider costs a uniform write rather than a geometry rebuild.
 */
export function borderSegmentPositions(lines: GeoLine[], uvOffsetU: number): Float32Array {
  const out = new Float32Array(countSegments(lines) * 6)
  let write = 0
  for (const line of lines) {
    const points = line.length >> 1
    let previousX = 0
    let previousY = 0
    let previousZ = 0
    let hasPrevious = false
    for (let i = 0; i < points; i += 1) {
      const [x, y, z] = lonLatToDirection(line[i * 2], line[i * 2 + 1], uvOffsetU)
      if (hasPrevious) {
        out[write] = previousX
        out[write + 1] = previousY
        out[write + 2] = previousZ
        out[write + 3] = x
        out[write + 4] = y
        out[write + 5] = z
        write += 6
      }
      previousX = x
      previousY = y
      previousZ = z
      hasPrevious = true
    }
  }
  return out
}

/**
 * A place's name in the chosen interface language.
 *
 * The dataset carries Natural Earth's localized names, so the city labels follow
 * the same language switch as the rest of the interface; a place without one
 * keeps its English name rather than showing nothing.
 */
export function placeName(place: GeoPlace, language: string): string {
  return language === 'zh' && place.zh ? place.zh : place.name
}

/** A country's name in the chosen interface language, exactly as `placeName`. */
export function countryName(country: GeoCountry, language: string): string {
  return language === 'zh' && country.zh ? country.zh : country.name
}

/**
 * The smallest `dot(surfaceNormal, viewDirection)` a label may have and still be
 * drawn — the one number behind the cull that drops the back face and the rim.
 *
 * A point `θ` around from the spot facing the camera sits at `sin θ` of the
 * globe's projected radius, so keeping labels inside `limbRadius` of that radius
 * is the same as requiring their normal to face the camera by at least
 * `cos θ = √(1 − limbRadius²)`. Working in the cosine keeps the test to a single
 * dot product per label, with no projection, and it is exact at both ends: 1 at
 * the centre of the disc, 0 at the limb, negative behind it.
 */
export function limbFacingThreshold(limbRadius: number): number {
  const squared = 1 - limbRadius * limbRadius
  // `> 0` rather than `Math.max`, so a missing or nonsensical fraction falls
  // back to "no rim cull" instead of a NaN that would hide every label.
  return squared > 0 ? Math.sqrt(squared) : 0
}

/** The places worth a text label, most important first. */
export function labelledPlaces(places: GeoPlace[]): GeoPlace[] {
  return places
    .filter((place) => place.label === 1)
    .sort((a, b) => a.tier - b.tier || b.cap - a.cap || b.pop - a.pop || a.rank - b.rank)
}
