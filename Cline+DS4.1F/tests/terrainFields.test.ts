import test from 'node:test'
import assert from 'node:assert/strict'
import { NearestFilter, RedFormat, SphereGeometry } from 'three'
import { SPHERE_LODS } from '../src/components/3d/geometry.ts'
import {
  buildTerrainFieldSet,
  buildTerrainLevelFields,
  potentialWaterCoverage,
  sampleTerrainLevelAt,
  terrainVertexFieldUv,
  triangleHasWater,
  WATER_MASK_ALPHA_CUTOFF,
  type ScalarField,
  type TerrainLevelFields,
} from '../src/components/3d/terrainFields.ts'

function scalar(width: number, height: number, value = 0): ScalarField {
  return { width, height, data: new Float32Array(width * height).fill(value) }
}

function bilinear(field: ScalarField, u: number, v: number): number {
  const x = u * field.width - 0.5
  const y = v * field.height - 0.5
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

function dispose(level: TerrainLevelFields): void {
  level.heightTexture.dispose()
  level.weightTexture.dispose()
}

function disposeSet(levels: TerrainLevelFields[]): void {
  levels.forEach(dispose)
}

test('dry geometry keeps full relief and constant elevation exactly', () => {
  const level = buildTerrainLevelFields(new SphereGeometry(1, 8, 4), scalar(8, 4, 0.375), scalar(8, 4), 0)
  for (const height of level.heights) assert.ok(Math.abs(height - 0.375) < 1e-7)
  for (const weight of level.weights) assert.equal(weight, 255)
  assert.equal(level.heightTexture.format, RedFormat)
  assert.equal(level.weightTexture.format, RedFormat)
  assert.equal(level.heightTexture.magFilter, NearestFilter)
  assert.equal(level.heightTexture.minFilter, NearestFilter)
  assert.equal(level.heightTexture.generateMipmaps, false)
  assert.equal(level.weightTexture.generateMipmaps, false)
  dispose(level)
})

test('potential ocean coverage requires both sufficient mask and real bathymetry', () => {
  const water = scalar(4, 1)
  const bathymetry = scalar(4, 1)
  water.data.set([1, 1, WATER_MASK_ALPHA_CUTOFF / 2, WATER_MASK_ALPHA_CUTOFF])
  bathymetry.data.set([0, 0.2, 1, 0.01])
  const coverage = potentialWaterCoverage(water, bathymetry)
  assert.deepEqual([...coverage.data], [0, 1, 0, 1])
})

test('zero-bathymetry blue regions preserve raw low and high inland DEM heights', () => {
  const elevation = scalar(4, 4)
  for (let index = 0; index < elevation.data.length; index += 1) elevation.data[index] = index / 15
  const noCoveredWater = potentialWaterCoverage(scalar(4, 4, 1), scalar(4, 4))
  const geometry = new SphereGeometry(1, 4, 4)
  const level = buildTerrainLevelFields(geometry, elevation, noCoveredWater, 0)
  const uv = geometry.getAttribute('uv')
  for (let row = 1; row < level.rows; row += 1) {
    for (let column = 0; column < level.columns; column += 1) {
      const index = row * (level.columns + 1) + column
      assert.equal(level.weights[index], 255)
      assert.ok(Math.abs(level.heights[index] - bilinear(elevation, uv.getX(index), 1 - uv.getY(index))) < 1e-7)
    }
  }
  dispose(level)
})

test('water in only a triangle bounding-box corner does not block that triangle', () => {
  const water = scalar(100, 100)
  const coordinates = [
    { x: 0.1, y: 0.9 },
    { x: 0.5, y: 0.9 },
    { x: 0.1, y: 0.5 },
  ]
  const uv = {
    getX: (index: number) => coordinates[index].x,
    getY: (index: number) => coordinates[index].y,
  }
  // The centre is inside the 10…50 texel bounds, but 13 texels beyond the
  // triangle's x + y = 60 hypotenuse. The old rectangle-only test blocked it.
  water.data[39 * 100 + 39] = 1
  assert.equal(triangleHasWater(water, uv, 0, 1, 2, 0), false)
  water.data[20 * 100 + 20] = 1
  assert.equal(triangleHasWater(water, uv, 0, 1, 2, 0), true)
})

test('an all-water globe has exactly zero land relief at every vertex', () => {
  const level = buildTerrainLevelFields(new SphereGeometry(1, 8, 4), scalar(8, 4, 0.8), scalar(8, 4, 1), 0)
  for (const weight of level.weights) assert.equal(weight, 0)
  dispose(level)
})

test('a one-texel inland lake forces zero on every water-triangle corner without flattening the whole map', () => {
  const elevation = scalar(64, 64, 0.8)
  const water = scalar(64, 64)
  water.data[24 * 64 + 24] = 1
  const geometry = new SphereGeometry(1, 16, 16)
  const level = buildTerrainLevelFields(geometry, elevation, water, 0)
  assert.ok(level.weights.some((weight) => weight === 0))
  assert.ok(level.weights.some((weight) => weight === 255))

  // Independent point-in-triangle check: any water-texel centre that really is
  // inside a triangle must make all three of its relief weights exactly zero.
  const uv = geometry.getAttribute('uv')
  const indices = geometry.index?.array as ArrayLike<number> | undefined
  assert.ok(indices)
  const pointInside = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ): boolean => {
    const v0x = cx - ax
    const v0y = cy - ay
    const v1x = bx - ax
    const v1y = by - ay
    const v2x = px - ax
    const v2y = py - ay
    const dot00 = v0x * v0x + v0y * v0y
    const dot01 = v0x * v1x + v0y * v1y
    const dot02 = v0x * v2x + v0y * v2y
    const dot11 = v1x * v1x + v1y * v1y
    const dot12 = v1x * v2x + v1y * v2y
    const denominator = dot00 * dot11 - dot01 * dot01
    if (Math.abs(denominator) < 1e-12) return false
    const u = (dot11 * dot02 - dot01 * dot12) / denominator
    const v = (dot00 * dot12 - dot01 * dot02) / denominator
    return u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8
  }

  for (let offset = 0; offset < indices.length; offset += 3) {
    const corners: number[] = [indices[offset], indices[offset + 1], indices[offset + 2]]
    const coordinates = corners.map((index) => ({ x: uv.getX(index), y: 1 - uv.getY(index) }))
    const waterX = (24 + 0.5) / 64
    const waterY = (24 + 0.5) / 64
    if (
      pointInside(
        waterX,
        waterY,
        coordinates[0].x,
        coordinates[0].y,
        coordinates[1].x,
        coordinates[1].y,
        coordinates[2].x,
        coordinates[2].y,
      )
    ) {
      for (const corner of corners) assert.equal(level.weights[corner], 0)
    }
  }
  dispose(level)
})

test('seam duplicates and each coincident pole group share final height and weight', () => {
  const elevation = scalar(16, 8)
  const water = scalar(16, 8)
  for (let index = 0; index < elevation.data.length; index += 1) {
    elevation.data[index] = (index % 11) / 10
    water.data[index] = index % 13 === 0 ? 1 : 0
  }
  const level = buildTerrainLevelFields(new SphereGeometry(1, 8, 4), elevation, water, 0.55)
  const stride = level.columns + 1
  for (let row = 0; row <= level.rows; row += 1) {
    const first = row * stride
    const last = first + level.columns
    assert.equal(level.weights[first], level.weights[last])
    assert.equal(level.heights[first], level.heights[last])
  }
  for (const row of [0, level.rows]) {
    const first = row * stride
    for (let column = 1; column <= level.columns; column += 1) {
      assert.equal(level.weights[first], level.weights[first + column])
      assert.equal(level.heights[first], level.heights[first + column])
    }
  }
  dispose(level)
})

test('every supported LOD preserves the zero-water-relief contract', () => {
  const fields = buildTerrainFieldSet(scalar(8, 4, 0.8), scalar(8, 4, 1), 0, SPHERE_LODS)
  assert.equal(fields.levels.length, 6)
  for (const level of fields.levels) {
    assert.equal(level.weights.length, (level.columns + 1) * (level.rows + 1))
    for (const weight of level.weights) assert.equal(weight, 0)
  }
  disposeSet(fields.levels)
})

test('field UV addressing recovers regular, north-pole and south-pole grid vertices', () => {
  assert.deepEqual(terrainVertexFieldUv(0.5, 0.5, 4, 4), { u: 0.5, v: 0.5 })
  assert.deepEqual(terrainVertexFieldUv(0.625, 1, 4, 4), { u: 0.5, v: 0.1 })
  assert.deepEqual(terrainVertexFieldUv(0.375, 0, 4, 4), { u: 0.5, v: 0.9 })
})

test('overlay sampling interpolates filtered height × coast weight per corner', () => {
  const level = buildTerrainLevelFields(new SphereGeometry(1, 4, 4), scalar(4, 4, 0.8), scalar(4, 4), 0)
  const columns = level.columns
  const stride = columns + 1
  const row = 1
  const aIndex = row * stride + 2
  const bIndex = row * stride + 1
  const dIndex = (row + 1) * stride + 2
  level.heights[aIndex] = 0.2
  level.heights[bIndex] = 0.4
  level.heights[dIndex] = 0.8
  level.weights[aIndex] = 0
  level.weights[bIndex] = 128
  level.weights[dIndex] = 255

  // This point selects au = av = 0.5 in row 1's A-B-D triangle.
  const sample = sampleTerrainLevelAt(level, 0, 0.375, 0.625)
  const au = 0.5
  const av = 0.5
  const shares = { a: au - av, b: 1 - au, d: av }
  const expectedHeight =
    0.2 * 0 * shares.a +
    0.4 * (128 / 255) * shares.b +
    0.8 * 1 * shares.d
  const expectedTaper = 0 * shares.a + (128 / 255) * shares.b + 1 * shares.d
  assert.ok(Math.abs(sample.height - expectedHeight) < 1e-7)
  assert.ok(Math.abs(sample.taper - expectedTaper) < 1e-7)
  dispose(level)
})
