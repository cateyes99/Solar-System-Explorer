import test from 'node:test'
import assert from 'node:assert/strict'
import { SphereGeometry } from 'three'
import type { BufferGeometry } from 'three'
import {
  buildCoastGeometry,
  getCoastGeometryStats,
} from '../src/components/3d/coastGeometry.ts'
import type { ScalarField } from '../src/components/3d/terrainFields.ts'

function scalar(
  width: number,
  height: number,
  value: number | ((u: number, v: number) => number),
): ScalarField {
  const data = new Float32Array(width * height)
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      data[row * width + column] =
        typeof value === 'number' ? value : value((column + 0.5) / width, (row + 0.5) / height)
    }
  }
  return { width, height, data }
}

function sampleBilinear(field: ScalarField, u: number, v: number): number {
  const x = (u - Math.floor(u)) * field.width - 0.5
  const y = Math.max(0, Math.min(1, v)) * field.height - 0.5
  const left = Math.floor(x)
  const top = Math.floor(y)
  const fx = x - left
  const fy = y - top
  const at = (column: number, row: number): number => {
    const wrapped = ((column % field.width) + field.width) % field.width
    const clamped = Math.max(0, Math.min(field.height - 1, row))
    return field.data[clamped * field.width + wrapped]
  }
  return (
    (at(left, top) * (1 - fx) + at(left + 1, top) * fx) * (1 - fy) +
    (at(left, top + 1) * (1 - fx) + at(left + 1, top + 1) * fx) * fy
  )
}

function assertValidGeometry(geometry: BufferGeometry): void {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = geometry.getAttribute('uv')
  const land = geometry.getAttribute('aLandWeight')
  const floor = geometry.getAttribute('aOceanFloor')
  assert.ok(position && normal && uv && land && floor)
  assert.equal(position.count, normal.count)
  assert.equal(position.count, uv.count)
  assert.equal(position.count, land.count)
  assert.equal(position.count, floor.count)

  for (let index = 0; index < position.count; index += 1) {
    const coordinates = [position.getX(index), position.getY(index), position.getZ(index)]
    const normalCoordinates = [normal.getX(index), normal.getY(index), normal.getZ(index)]
    for (const value of [
      ...coordinates,
      ...normalCoordinates,
      uv.getX(index),
      uv.getY(index),
      land.getX(index),
      floor.getX(index),
    ]) {
      assert.ok(Number.isFinite(value), `non-finite attribute at vertex ${index}`)
    }
    const length = Math.hypot(...coordinates)
    assert.ok(Math.abs(length - 1) < 1e-6, `position ${index} has radius ${length}`)
    assert.ok(Math.abs(Math.hypot(...normalCoordinates) - 1) < 1e-6)
    assert.ok(Math.abs(coordinates[0] * normalCoordinates[0] + coordinates[1] * normalCoordinates[1] + coordinates[2] * normalCoordinates[2] - 1) < 1e-6)
    assert.ok(land.getX(index) === 0 || land.getX(index) === 1)
    assert.ok(floor.getX(index) === 0 || floor.getX(index) === 1)
  }

  const indices = geometry.index?.array
  assert.ok(indices)
  assert.equal(indices.length % 3, 0)
  for (const index of indices) {
    assert.ok(Number.isInteger(index))
    assert.ok(index >= 0 && index < position.count, `index ${index} outside ${position.count} vertices`)
  }
}

function directionAt(base: SphereGeometry, index: number): [number, number, number] {
  const position = base.getAttribute('position')
  const x = position.getX(index)
  const y = position.getY(index)
  const z = position.getZ(index)
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

function findOriginalVertex(base: SphereGeometry, geometry: BufferGeometry, original: number): number {
  const expected = directionAt(base, original)
  const baseUv = base.getAttribute('uv')
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let index = 0; index < position.count; index += 1) {
    const distance = Math.hypot(
      position.getX(index) - expected[0],
      position.getY(index) - expected[1],
      position.getZ(index) - expected[2],
    )
    const du = uv.getX(index) - baseUv.getX(original)
    const atPole = Math.abs(expected[1]) > 1 - 1e-6
    if (
      distance < 1e-6 &&
      (atPole || (Math.abs(du - Math.round(du)) < 1e-6 && Math.abs(uv.getY(index) - baseUv.getY(original)) < 1e-6))
    ) {
      return index
    }
  }
  return -1
}

test('fully dry inland geometry preserves original vertices with full raw-land weight', () => {
  const base = new SphereGeometry(1, 8, 4)
  const geometry = buildCoastGeometry(
    base,
    scalar(16, 8, 0.8),
    scalar(16, 8, 0),
    scalar(16, 8, 0),
    0,
    0.25,
    4,
    scalar(16, 8, 0),
  )
  assertValidGeometry(geometry)
  const stats = getCoastGeometryStats(geometry)
  assert.ok(stats)
  assert.equal(stats.refinedSourceTriangles, 0)
  assert.equal(stats.landTriangles, base.index!.count / 3)
  assert.equal(stats.oceanFloorTriangles, 0)
  assert.equal(stats.skirtTriangles, 0)

  const originalIndices = new Set(base.index!.array)
  for (const original of originalIndices) {
    const generated = findOriginalVertex(base, geometry, original)
    assert.ok(generated >= 0, `missing original vertex ${original}`)
    assert.equal(geometry.getAttribute('aLandWeight').getX(generated), 1)
    assert.equal(geometry.getAttribute('aOceanFloor').getX(generated), 0)
  }
})

test('fully ocean geometry is all ocean floor and has no land or skirts', () => {
  const base = new SphereGeometry(1, 8, 4)
  const geometry = buildCoastGeometry(
    base,
    // The ocean-only mask, not raw DEM height, determines genuine ocean.
    scalar(16, 8, 0.8),
    scalar(16, 8, 1),
    scalar(16, 8, 0.7),
    0,
    0.25,
    4,
    scalar(16, 8, 1),
  )
  assertValidGeometry(geometry)
  const stats = getCoastGeometryStats(geometry)
  assert.ok(stats)
  assert.equal(stats.refinedSourceTriangles, 0)
  assert.equal(stats.landTriangles, 0)
  assert.equal(stats.oceanFloorTriangles, base.index!.count / 3)
  assert.equal(stats.coastlineSegments, 0)
  for (const weight of geometry.getAttribute('aLandWeight').array) assert.equal(weight, 0)
  for (const weight of geometry.getAttribute('aOceanFloor').array) assert.equal(weight, 1)
})

test('a coast is clipped into land and ocean with mean-radius skirt boundary attributes', () => {
  const base = new SphereGeometry(1, 12, 6)
  const elevation = scalar(24, 12, (u) => (u < 0.5 ? 0.8 : 0.1))
  const geometry = buildCoastGeometry(
    base,
    elevation,
    scalar(24, 12, 1),
    scalar(24, 12, 0.6),
    0,
    0.25,
    4,
    scalar(24, 12, (u) => (u < 0.5 ? 0 : 1)),
  )
  assertValidGeometry(geometry)
  const stats = getCoastGeometryStats(geometry)
  assert.ok(stats)
  assert.ok(stats.refinedSourceTriangles > 0)
  assert.ok(stats.landTriangles > 0)
  assert.ok(stats.oceanFloorTriangles > 0)
  assert.ok(stats.coastlineSegments > 0)
  assert.equal(stats.skirtTriangles, stats.coastlineSegments * 2)

  const land = geometry.getAttribute('aLandWeight')
  const floor = geometry.getAttribute('aOceanFloor')
  let boundaries = 0
  let floorInteriors = 0
  for (let index = 0; index < land.count; index += 1) {
    if (land.getX(index) === 0 && floor.getX(index) === 0) boundaries += 1
    if (land.getX(index) === 0 && floor.getX(index) === 1) floorInteriors += 1
  }
  assert.ok(boundaries > 0, 'ocean/skirt boundary stays at mean radius')
  assert.ok(floorInteriors > 0, 'ocean interiors alone receive seafloor sink')

  // Identify skirts by their actual geometry/attributes, not by source text.
  // Their top indices must be the very same indices used by the raw-land cap;
  // their bottom indices must likewise be shared with the mean ocean boundary.
  const position = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  const indices = geometry.index!.array
  const landCapVertices = new Set<number>()
  const oceanCapBoundaryVertices = new Set<number>()
  const skirtTopVertices = new Set<number>()
  const skirtBottomVertices = new Set<number>()
  let inspectedSkirts = 0
  for (let offset = 0; offset < indices.length; offset += 3) {
    const triangle = [indices[offset], indices[offset + 1], indices[offset + 2]]
    const landVertices = triangle.filter((index) => land.getX(index) === 1)
    const boundaryVertices = triangle.filter((index) => land.getX(index) === 0 && floor.getX(index) === 0)
    const floorVertices = triangle.filter((index) => floor.getX(index) === 1)
    if (landVertices.length > 0 && boundaryVertices.length > 0) {
      assert.equal(floorVertices.length, 0, 'a skirt must not contain ocean-floor interior')
      landVertices.forEach((index) => skirtTopVertices.add(index))
      boundaryVertices.forEach((index) => skirtBottomVertices.add(index))
      inspectedSkirts += 1
    } else if (landVertices.length === 3) {
      landVertices.forEach((index) => landCapVertices.add(index))
    } else if (boundaryVertices.length > 0) {
      assert.ok(floorVertices.length > 0, 'ocean boundary belongs to an ocean-floor cap')
      boundaryVertices.forEach((index) => oceanCapBoundaryVertices.add(index))
    }
  }
  assert.equal(inspectedSkirts, stats.skirtTriangles)
  assert.ok(skirtTopVertices.size > 0)
  const sameLocation = (a: number, b: number): boolean =>
    Math.hypot(
      position.getX(a) - position.getX(b),
      position.getY(a) - position.getY(b),
      position.getZ(a) - position.getZ(b),
    ) < 1e-7 &&
    Math.abs(uv.getX(a) - uv.getX(b)) < 1e-7 &&
    Math.abs(uv.getY(a) - uv.getY(b)) < 1e-7

  const capBoundaryVertices = [...landCapVertices].filter((top) =>
    [...skirtBottomVertices].some((bottom) => sameLocation(top, bottom)),
  )
  assert.deepEqual(
    [...skirtTopVertices].sort((a, b) => a - b),
    capBoundaryVertices.sort((a, b) => a - b),
    'skirt tops and raw-land cap coastline share exact vertex indices',
  )
  assert.deepEqual(
    [...skirtBottomVertices].sort((a, b) => a - b),
    [...oceanCapBoundaryVertices].sort((a, b) => a - b),
    'skirt bottoms and ocean cap coastline share exact mean-radius indices',
  )
  for (const top of skirtTopVertices) {
    assert.equal(land.getX(top), 1)
    assert.equal(floor.getX(top), 0)
    const bottom = [...skirtBottomVertices].find((index) => sameLocation(top, index))
    assert.ok(bottom !== undefined && bottom !== top)
    assert.equal(land.getX(bottom), 0)
    assert.equal(floor.getX(bottom), 0)
  }
})

test('an elevated masked inland lake remains raw land and never becomes ocean floor', () => {
  const base = new SphereGeometry(1, 16, 8)
  const elevation = scalar(16, 8, 0.1)
  // A broad, entirely inland high-DEM lake surrounded by low ocean. Water and
  // bathymetry remain positive, while the synthetic connected-component result
  // excludes this separate elevated component from the open-ocean mask.
  const oceanMask = scalar(16, 8, 1)
  for (let row = 2; row <= 5; row += 1) {
    for (let column = 5; column <= 9; column += 1) {
      elevation.data[row * 16 + column] = 0.9
      oceanMask.data[row * 16 + column] = 0
    }
  }
  const water = scalar(16, 8, 1)
  const bathymetry = scalar(16, 8, 0.6)
  const uvOffset = 0
  const seaLevel = 0.25
  const geometry = buildCoastGeometry(base, elevation, water, bathymetry, uvOffset, seaLevel, 4, oceanMask)
  assertValidGeometry(geometry)

  const baseUv = base.getAttribute('uv')
  const land = geometry.getAttribute('aLandWeight')
  const floor = geometry.getAttribute('aOceanFloor')
  let checkedLakeVertices = 0
  for (let original = 0; original < base.getAttribute('position').count; original += 1) {
    const u = baseUv.getX(original) + uvOffset
    const topDownV = 1 - baseUv.getY(original)
    if (sampleBilinear(elevation, u, topDownV) <= seaLevel) continue
    if (sampleBilinear(oceanMask, u, topDownV) >= 0.004) continue
    if (sampleBilinear(water, u, topDownV) < 0.004 || sampleBilinear(bathymetry, u, topDownV) <= 0) continue
    const generated = findOriginalVertex(base, geometry, original)
    assert.ok(generated >= 0, `missing elevated lake vertex ${original}`)
    assert.equal(land.getX(generated), 1)
    assert.equal(floor.getX(generated), 0)
    checkedLakeVertices += 1
  }
  assert.ok(checkedLakeVertices > 0, 'the test must exercise actual elevated lake vertices')
})

test('longitude offset, seam and coincident pole rows produce finite indexed unit geometry', () => {
  const base = new SphereGeometry(1, 12, 6)
  const elevation = scalar(24, 12, (u, v) =>
    0.5 + 0.45 * Math.sin(6 * Math.PI * u) * Math.cos(Math.PI * v),
  )
  const water = scalar(24, 12, (u) =>
    u < 0.2 || (u > 0.55 && u < 0.7) ? 0 : 1,
  )
  const geometry = buildCoastGeometry(
    base,
    elevation,
    water,
    scalar(24, 12, 0.5),
    0.37,
    0.5,
    3,
    water,
  )
  assertValidGeometry(geometry)
  assert.ok(getCoastGeometryStats(geometry)!.coastlineSegments > 0)

  const position = geometry.getAttribute('position')
  let northPoles = 0
  let southPoles = 0
  for (let index = 0; index < position.count; index += 1) {
    if (Math.abs(position.getY(index)) === 1) {
      assert.equal(position.getX(index), 0)
      assert.equal(position.getZ(index), 0)
      if (position.getY(index) > 0) northPoles += 1
      else southPoles += 1
    }
  }
  assert.ok(northPoles > 0 && southPoles > 0)
})
