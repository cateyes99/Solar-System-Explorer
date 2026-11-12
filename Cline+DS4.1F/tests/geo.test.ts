import test from 'node:test'
import assert from 'node:assert/strict'
import {
  borderSegmentPositions,
  countSegments,
  labelledPlaces,
  limbFacingThreshold,
  lonLatToDirection,
  placeName,
  type GeoPlace,
} from '../src/utils/geo.ts'

/**
 * The World-map overlay's projection. Run with `npm test`.
 *
 * The important property is that a longitude/latitude lands on the same texel
 * the surface material samples it from, because the whole point of the overlay
 * is that a border sits on the continent it belongs to. The offset the day map
 * is shifted by must therefore be applied in exactly the same place.
 */

/** The map texel a sphere direction samples, inverting the sphere's own UVs. */
function mapTexelFromDirection(
  [x, y, z]: [number, number, number],
  uvOffsetU: number,
): { u: number; v: number } {
  const theta = Math.acos(Math.min(1, Math.max(-1, y)))
  const phi = Math.atan2(z, -x)
  let u = (phi / (2 * Math.PI) + uvOffsetU) % 1
  if (u < 0) u += 1
  return { u, v: theta / Math.PI }
}

const close = (a: number, b: number, tolerance = 1e-9): boolean => Math.abs(a - b) <= tolerance

/** Compares two directions, tolerating float32 rounding and a signed zero. */
function assertDirection(
  actual: ArrayLike<number>,
  expected: [number, number, number],
  tolerance = 1e-6,
): void {
  for (let i = 0; i < 3; i += 1) {
    assert.ok(close(actual[i], expected[i], tolerance), `${actual[i]} vs ${expected[i]} at ${i}`)
  }
}

test('the cardinal points map to the expected directions', () => {
  // With no longitude offset, 0° longitude sits on +X, 90°E on −Z, 180° on −X.
  assertDirection(lonLatToDirection(0, 0, 0), [1, 0, 0])
  assertDirection(lonLatToDirection(90, 0, 0), [0, 0, -1])
  assertDirection(lonLatToDirection(180, 0, 0), [-1, 0, 0])
  // The poles are exactly ±Y whatever the longitude.
  assertDirection(lonLatToDirection(0, 90, 0), [0, 1, 0])
  assertDirection(lonLatToDirection(37, -90, 0), [0, -1, 0])
})

test('every direction is a unit vector', () => {
  for (const [lon, lat] of [
    [0, 0],
    [12.5, 41.9],
    [-58.4, -34.6],
    [139.7, 35.7],
    [-179.9, -84],
    [180, 89.9],
  ]) {
    const [x, y, z] = lonLatToDirection(lon, lat, 0.55)
    assert.ok(close(Math.hypot(x, y, z), 1, 1e-12), `not unit at ${lon}, ${lat}`)
  }
})

test('a direction samples the texel its longitude and latitude name', () => {
  // This is the alignment guarantee: the day map is sampled at `sphereUv +
  // offset`, so the overlay must apply the same offset to land on the map.
  for (const offset of [0, 0.55, 0.25]) {
    for (const [lon, lat] of [
      [0, 0],
      [90, 0],
      [-90, 0],
      [179.9, 12.3],
      [-179.9, -12.3],
      [12.4478, 41.9033],
      [-58.3816, -34.6037],
      [151.2093, -33.8688],
    ]) {
      const texel = mapTexelFromDirection(lonLatToDirection(lon, lat, offset), offset)
      const expectedU = (((lon + 180) / 360) % 1 + 1) % 1
      const expectedV = (90 - lat) / 180
      assert.ok(close(texel.u, expectedU, 1e-9), `u ${texel.u} vs ${expectedU} at ${lon},${lat}`)
      assert.ok(close(texel.v, expectedV, 1e-9), `v ${texel.v} vs ${expectedV} at ${lon},${lat}`)
    }
  }
})

test('the longitude offset rotates the globe without changing latitudes', () => {
  const plain = lonLatToDirection(30, 20, 0)
  const shifted = lonLatToDirection(30, 20, 0.25)
  // A quarter turn in u is a quarter turn around the pole.
  assert.ok(close(plain[1], shifted[1], 1e-12))
  assert.ok(!close(plain[0], shifted[0], 1e-3))
})

test('a polyline of n points becomes n − 1 segments', () => {
  const lines = [[0, 0, 10, 10, 20, 20]]
  assert.equal(countSegments(lines), 2)
  const positions = borderSegmentPositions(lines, 0)
  // Six floats per segment: start xyz then end xyz.
  assert.equal(positions.length, 12)
  const first = lonLatToDirection(0, 0, 0)
  const second = lonLatToDirection(10, 10, 0)
  const third = lonLatToDirection(20, 20, 0)
  assertDirection(positions.subarray(0, 3), first)
  assertDirection(positions.subarray(3, 6), second)
  assertDirection(positions.subarray(6, 9), second)
  assertDirection(positions.subarray(9, 12), third)
})

test('a degenerate polyline contributes no segments', () => {
  assert.equal(countSegments([[], [0], [1, 2]]), 0)
  assert.equal(borderSegmentPositions([[], [1, 2]], 0).length, 0)
})

test('labelled places are ordered by tier, then capitals-first by population', () => {
  const place = (
    name: string,
    cap: number,
    pop: number,
    label: number,
    tier: number,
    zh = '',
  ): GeoPlace => ({ name, zh, lon: 0, lat: 0, cap, pop, rank: 0, label, tier })
  const places = [
    place('Small Town', 0, 1_000, 0, 1),
    place('Secondary City', 0, 20_000_000, 1, 1),
    place('Capital', 1, 500_000, 1, 0),
    place('Mega City', 0, 40_000_000, 1, 0),
  ]
  const labelled = labelledPlaces(places)
  // Tier 0 first (a capital before a larger non-capital), then tier 1.
  assert.deepEqual(
    labelled.map((entry) => entry.name),
    ['Capital', 'Mega City', 'Secondary City'],
  )
})

test('a place name follows the interface language, falling back to English', () => {
  const tokyo: GeoPlace = {
    name: 'Tokyo',
    zh: '东京',
    lon: 0,
    lat: 0,
    cap: 1,
    pop: 1,
    rank: 0,
    label: 1,
    tier: 0,
  }
  assert.equal(placeName(tokyo, 'en'), 'Tokyo')
  assert.equal(placeName(tokyo, 'zh'), '东京')
  // A place the source has no translation for keeps its English name.
  assert.equal(placeName({ ...tokyo, zh: '' }, 'zh'), 'Tokyo')
})

test('the limb cull turns the requested radius fraction into a cosine', () => {
  // A label at `limbRadius` of the globe's projected radius sits at sin θ =
  // limbRadius, so the value the per-frame dot product is compared against is
  // cos θ = √(1 − limbRadius²).
  assert.ok(close(limbFacingThreshold(27 / 30), Math.sqrt(1 - (27 / 30) ** 2), 1e-12))
  assert.ok(close(limbFacingThreshold(27 / 30), 0.436, 1e-3))
  // A tighter fraction is a *higher* bar, so it keeps less of the rim.
  assert.ok(limbFacingThreshold(27 / 30) > limbFacingThreshold(29 / 30))
  assert.ok(limbFacingThreshold(29 / 30) > limbFacingThreshold(49 / 50))
  // The centre of the disc is always kept...
  assert.equal(limbFacingThreshold(0), 1)
  // ...and an impossible fraction can never make the threshold negative, which
  // would let back-face labels through.
  assert.equal(limbFacingThreshold(2), 0)
  assert.equal(limbFacingThreshold(Number.NaN), 0)
})
