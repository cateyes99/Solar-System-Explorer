import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { SphereGeometry } from 'three'
import type { ScalarField } from './terrainFields'

const WATER_MASK_CUTOFF = 0.004
const COVERAGE_EPSILON = 1e-7
const DEFAULT_REFINEMENT = 4
const MAX_REFINEMENT = 16

export interface CoastGeometryStats {
  sourceTriangles: number
  refinedSourceTriangles: number
  landTriangles: number
  oceanFloorTriangles: number
  coastlineSegments: number
  skirtTriangles: number
  vertexCount: number
}

interface Fields {
  oceanMask: ScalarField
  bathymetry: ScalarField
  uvOffset: number
}

type Direction = readonly [number, number, number]

interface SampleVertex {
  id: string
  direction: Direction
  u: number
  v: number
  score: number
  ocean: boolean
  boundary: boolean
}

function normalize(x: number, y: number, z: number): Direction {
  const length = Math.hypot(x, y, z)
  if (!(length > 0) || !Number.isFinite(length)) return [0, 1, 0]
  return [x / length, y / length, z / length]
}

/** Bilinear sample in top-down map UV, with periodic longitude and clamped latitude. */
function sampleBilinear(field: ScalarField, u: number, v: number): number {
  const wrappedU = u - Math.floor(u)
  const x = wrappedU * field.width - 0.5
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
  const a = at(left, top)
  const b = at(left + 1, top)
  const c = at(left, top + 1)
  const d = at(left + 1, top + 1)
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
}

/**
 * A continuous signed version of the ocean-mask/depth coverage predicate.
 * Positive is ocean and negative is land/lake. Moving exact accepted thresholds
 * just inside the positive side avoids ambiguous zero-valued corners during clipping.
 */
function signedOceanCoverage(fields: Fields, u: number, sphereV: number): number {
  const mapU = u + fields.uvOffset
  const topDownV = 1 - sphereV
  const ocean = sampleBilinear(fields.oceanMask, mapU, topDownV)
  const bathymetry = sampleBilinear(fields.bathymetry, mapU, topDownV)

  const oceanMargin = ocean - WATER_MASK_CUTOFF
  const signedOcean = oceanMargin >= 0 ? Math.max(COVERAGE_EPSILON, oceanMargin) : oceanMargin
  const signedBathymetry =
    bathymetry > 0 ? Math.max(COVERAGE_EPSILON, bathymetry) : Math.min(-COVERAGE_EPSILON, bathymetry)
  return Math.min(signedOcean, signedBathymetry)
}

function sampledVertex(
  id: string,
  direction: Direction,
  u: number,
  v: number,
  fields: Fields,
): SampleVertex {
  const score = signedOceanCoverage(fields, u, v)
  return { id, direction, u, v, score, ocean: score > 0, boundary: false }
}

function assertField(field: ScalarField, name: string): void {
  if (
    !Number.isInteger(field.width) ||
    !Number.isInteger(field.height) ||
    field.width <= 0 ||
    field.height <= 0 ||
    field.data.length < field.width * field.height
  ) {
    throw new Error(`${name} must have positive integer dimensions and a complete data array`)
  }
}

/**
 * Returns build statistics without relying on the untyped `userData` contract.
 * `null` means that the geometry was not produced by `buildCoastGeometry`.
 */
export function getCoastGeometryStats(geometry: BufferGeometry): Readonly<CoastGeometryStats> | null {
  return (geometry.userData.coastGeometryStats as CoastGeometryStats | undefined) ?? null
}

/**
 * Partitions a sphere into raw-relief land/lake and sunken ocean-floor triangles,
 * adding radial coast skirts between them. The input is not modified or disposed.
 *
 * Every original triangle is sampled on a small triangular lattice. Uniformly
 * land or ocean triangles are emitted unchanged; only mixed triangles receive
 * refined, clipped geometry. A mixed refined triangle is split along the zero
 * crossing of the signed coverage field. Its land boundary receives
 * `aLandWeight = 1`, its mean-radius ocean/skirt boundary receives both weights
 * zero, and ocean interiors receive `aOceanFloor = 1`. Consequently the caller
 * can apply raw `landOffset * aLandWeight` and seafloor sink * `aOceanFloor`
 * without flattening a whole water triangle or tapering inland terrain.
 *
 * Positions and normals are unit-sphere directions. UVs are interpolated from
 * the actual sphere UVs, with longitude sampled periodically and latitude
 * clamped. Coincident exact-pole rows use one representative actual pole UV so
 * neighbouring refined triangles agree at the equirectangular singularity.
 * Vertices are welded within each refined source triangle and by attribute role
 * on original triangles; intentional land/mean-boundary duplicates are not
 * globally welded, but shared geometric edges are evaluated identically.
 *
 * Limitations: this is fixed-resolution triangular marching, not an exact raster
 * coastline or a topology-preserving contour tracer. Islands/lakes lying wholly
 * between lattice samples can be missed, and each mixed refined triangle
 * approximates its boundary by one straight segment. Increase `refinement`
 * (integer 1…16, default 4) where the source maps require it. Raw dry terrain
 * below `seaLevelTexel` is deliberately not clamped, so such a coast can produce
 * a folded skirt. Skirt normals remain radial rather than becoming face normals.
 * The input must be an indexed, outward-wound `SphereGeometry` with position/uv.
 * `oceanMask` is the already-connected, ocean-only soft mask from the terrain
 * cache. It deliberately replaces any local raw-DEM ocean exclusion: genuine
 * open-ocean texels may have above-sea DEM samples. Standalone callers should
 * pass a synthetic ocean-only mask as the eighth argument (after `refinement`).
 * If omitted, `waterMask` is used directly; that compatibility fallback cannot
 * distinguish elevated inland lakes and is therefore unsuitable for Earth maps
 * containing them.
 */
export function buildCoastGeometry(
  base: SphereGeometry,
  elevation: ScalarField,
  waterMask: ScalarField,
  bathymetry: ScalarField,
  uvOffset: number,
  seaLevelTexel: number,
  refinement = DEFAULT_REFINEMENT,
  oceanMask?: ScalarField,
): BufferGeometry {
  assertField(elevation, 'elevation')
  assertField(waterMask, 'waterMask')
  assertField(bathymetry, 'bathymetry')
  assertField(oceanMask ?? waterMask, 'oceanMask')
  if (!Number.isFinite(uvOffset) || !Number.isFinite(seaLevelTexel)) {
    throw new Error('uvOffset and seaLevelTexel must be finite')
  }
  if (!Number.isInteger(refinement) || refinement < 1 || refinement > MAX_REFINEMENT) {
    throw new Error(`refinement must be an integer from 1 to ${MAX_REFINEMENT}`)
  }

  const position = base.getAttribute('position')
  const uv = base.getAttribute('uv')
  const sourceIndex = base.index?.array
  if (!position || !uv || !sourceIndex || sourceIndex.length % 3 !== 0) {
    throw new Error('base must be an indexed SphereGeometry with position and uv attributes')
  }

  const fields: Fields = { oceanMask: oceanMask ?? waterMask, bathymetry, uvOffset }
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const landWeights: number[] = []
  const oceanFloors: number[] = []
  const indices: number[] = []
  const emittedVertices = new Map<string, number>()
  const stats: CoastGeometryStats = {
    sourceTriangles: sourceIndex.length / 3,
    refinedSourceTriangles: 0,
    landTriangles: 0,
    oceanFloorTriangles: 0,
    coastlineSegments: 0,
    skirtTriangles: 0,
    vertexCount: 0,
  }

  const baseDirection = (index: number): Direction => {
    const direction = normalize(position.getX(index), position.getY(index), position.getZ(index))
    if (
      Math.abs(direction[1]) > 1 - 1e-7 &&
      Math.hypot(direction[0], direction[2]) < 1e-7
    ) {
      return [0, Math.sign(direction[1]), 0]
    }
    return direction
  }

  // Longitude has no geometric meaning at an exact pole. Choose the first
  // actual sphere UV at each pole and use it consistently in every wedge.
  const poleUvs = new Map<number, { u: number; v: number }>()
  for (let index = 0; index < position.count; index += 1) {
    const direction = baseDirection(index)
    if (Math.abs(direction[1]) === 1 && !poleUvs.has(direction[1])) {
      poleUvs.set(direction[1], { u: uv.getX(index), v: uv.getY(index) })
    }
  }

  const baseVertices = new Map<number, SampleVertex>()
  const getBaseVertex = (index: number): SampleVertex => {
    const cached = baseVertices.get(index)
    if (cached) return cached
    const direction = baseDirection(index)
    const poleUv = poleUvs.get(direction[1])
    const actualPole = Math.abs(direction[1]) === 1 && poleUv !== undefined
    const vertex = sampledVertex(
      `b${index}`,
      direction,
      actualPole ? poleUv.u : uv.getX(index),
      actualPole ? poleUv.v : uv.getY(index),
      fields,
    )
    baseVertices.set(index, vertex)
    return vertex
  }

  const addVertex = (
    key: string,
    direction: Direction,
    u: number,
    v: number,
    landWeight: number,
    oceanFloor: number,
  ): number => {
    const cached = emittedVertices.get(key)
    if (cached !== undefined) return cached
    const index = positions.length / 3
    positions.push(direction[0], direction[1], direction[2])
    normals.push(direction[0], direction[1], direction[2])
    uvs.push(u, v)
    landWeights.push(landWeight)
    oceanFloors.push(oceanFloor)
    emittedVertices.set(key, index)
    return index
  }

  const addOriginal = (index: number, ocean: boolean): number => {
    const vertex = getBaseVertex(index)
    return addVertex(
      `${ocean ? 'ocean' : 'land'}:${index}`,
      vertex.direction,
      vertex.u,
      vertex.v,
      ocean ? 0 : 1,
      ocean ? 1 : 0,
    )
  }

  const emitOriginalTriangle = (a: number, b: number, c: number, ocean: boolean): void => {
    indices.push(addOriginal(a, ocean), addOriginal(b, ocean), addOriginal(c, ocean))
    if (ocean) stats.oceanFloorTriangles += 1
    else stats.landTriangles += 1
  }

  for (let sourceOffset = 0; sourceOffset < sourceIndex.length; sourceOffset += 3) {
    const sourceCorners = [sourceIndex[sourceOffset], sourceIndex[sourceOffset + 1], sourceIndex[sourceOffset + 2]]
    const originalCorners = sourceCorners.map((index) => getBaseVertex(index)) as [
      SampleVertex,
      SampleVertex,
      SampleVertex,
    ]
    const corners = originalCorners.map((vertex) => ({ ...vertex })) as [
      SampleVertex,
      SampleVertex,
      SampleVertex,
    ]

    // Unwrap only for interpolation. The sampler itself is periodic, and fully
    // uniform triangles above retain their actual, unmodified sphere UVs.
    for (let corner = 1; corner < 3; corner += 1) {
      while (corners[corner].u - corners[0].u > 0.5) corners[corner].u -= 1
      while (corners[corner].u - corners[0].u < -0.5) corners[corner].u += 1
    }

    const lattice = new Map<string, SampleVertex>()
    const latticeKey = (i: number, j: number): string => `${i},${j}`
    const getLatticeVertex = (i: number, j: number): SampleVertex => {
      const key = latticeKey(i, j)
      const cached = lattice.get(key)
      if (cached) return cached
      if (i === 0 && j === 0) return corners[0]
      if (i === refinement && j === 0) return corners[1]
      if (i === 0 && j === refinement) return corners[2]

      const bWeight = i / refinement
      const cWeight = j / refinement
      const aWeight = 1 - bWeight - cWeight
      const direction = normalize(
        corners[0].direction[0] * aWeight + corners[1].direction[0] * bWeight + corners[2].direction[0] * cWeight,
        corners[0].direction[1] * aWeight + corners[1].direction[1] * bWeight + corners[2].direction[1] * cWeight,
        corners[0].direction[2] * aWeight + corners[1].direction[2] * bWeight + corners[2].direction[2] * cWeight,
      )
      const vertex = sampledVertex(
        key,
        direction,
        corners[0].u * aWeight + corners[1].u * bWeight + corners[2].u * cWeight,
        corners[0].v * aWeight + corners[1].v * bWeight + corners[2].v * cWeight,
        fields,
      )
      lattice.set(key, vertex)
      return vertex
    }

    // Corners are not inserted by the lazy accessor, so seed them explicitly.
    lattice.set(latticeKey(0, 0), corners[0])
    lattice.set(latticeKey(refinement, 0), corners[1])
    lattice.set(latticeKey(0, refinement), corners[2])
    let hasLand = false
    let hasOcean = false
    for (let i = 0; i <= refinement; i += 1) {
      for (let j = 0; j <= refinement - i; j += 1) {
        if (getLatticeVertex(i, j).ocean) hasOcean = true
        else hasLand = true
      }
    }

    if (!hasOcean) {
      emitOriginalTriangle(sourceCorners[0], sourceCorners[1], sourceCorners[2], false)
      continue
    }
    if (!hasLand) {
      emitOriginalTriangle(sourceCorners[0], sourceCorners[1], sourceCorners[2], true)
      continue
    }

    const sourceId = String(sourceOffset / 3)
    const crossings = new Map<string, SampleVertex>()
    const localVertices = new Map<string, number>()
    stats.refinedSourceTriangles += 1

    const crossing = (a: SampleVertex, b: SampleVertex): SampleVertex => {
      const pair = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`
      const cached = crossings.get(pair)
      if (cached) return cached
      const denominator = a.score - b.score
      const t = denominator !== 0 ? Math.max(0, Math.min(1, a.score / denominator)) : 0.5
      const direction = normalize(
        a.direction[0] + (b.direction[0] - a.direction[0]) * t,
        a.direction[1] + (b.direction[1] - a.direction[1]) * t,
        a.direction[2] + (b.direction[2] - a.direction[2]) * t,
      )
      const vertex: SampleVertex = {
        id: `x${pair}`,
        direction,
        u: a.u + (b.u - a.u) * t,
        v: a.v + (b.v - a.v) * t,
        score: 0,
        ocean: false,
        boundary: true,
      }
      crossings.set(pair, vertex)
      return vertex
    }

    /** Clip in either direction while retaining the source triangle's winding. */
    const clip = (triangle: readonly SampleVertex[], ocean: boolean): SampleVertex[] => {
      const output: SampleVertex[] = []
      let previous = triangle[triangle.length - 1]
      let previousInside = previous.ocean === ocean
      for (const current of triangle) {
        const currentInside = current.ocean === ocean
        if (currentInside !== previousInside) output.push(crossing(previous, current))
        if (currentInside) output.push(current)
        previous = current
        previousInside = currentInside
      }
      return output
    }

    const localVertex = (vertex: SampleVertex, role: 'land' | 'floor' | 'boundary'): number => {
      const key = `${sourceId}:${role}:${vertex.id}`
      const cached = localVertices.get(key)
      if (cached !== undefined) return cached
      const index = addVertex(
        `refined:${key}`,
        vertex.direction,
        vertex.u,
        vertex.v,
        role === 'land' ? 1 : 0,
        role === 'floor' ? 1 : 0,
      )
      localVertices.set(key, index)
      return index
    }

    const emitRefinedTriangle = (
      a: SampleVertex,
      b: SampleVertex,
      c: SampleVertex,
      ocean: boolean,
    ): void => {
      if (a.id === b.id || b.id === c.id || c.id === a.id) return
      const role = (vertex: SampleVertex): 'land' | 'floor' | 'boundary' => {
        if (!ocean) return 'land'
        return vertex.boundary ? 'boundary' : 'floor'
      }
      indices.push(localVertex(a, role(a)), localVertex(b, role(b)), localVertex(c, role(c)))
      if (ocean) stats.oceanFloorTriangles += 1
      else stats.landTriangles += 1
    }

    const emitPolygon = (polygon: SampleVertex[], ocean: boolean): void => {
      for (let index = 1; index + 1 < polygon.length; index += 1) {
        emitRefinedTriangle(polygon[0], polygon[index], polygon[index + 1], ocean)
      }
    }

    const emitSkirt = (a: SampleVertex, b: SampleVertex): void => {
      // Land polygons retain outward source winding, so their coast edge has
      // land on the left and ocean on the right. This quad faces the ocean.
      const topA = localVertex(a, 'land')
      const topB = localVertex(b, 'land')
      const bottomA = localVertex(a, 'boundary')
      const bottomB = localVertex(b, 'boundary')
      indices.push(topA, bottomA, topB, topB, bottomA, bottomB)
      stats.coastlineSegments += 1
      stats.skirtTriangles += 2
    }

    const processRefinedTriangle = (triangle: readonly [SampleVertex, SampleVertex, SampleVertex]): void => {
      const oceanCorners = Number(triangle[0].ocean) + Number(triangle[1].ocean) + Number(triangle[2].ocean)
      if (oceanCorners === 0) {
        emitRefinedTriangle(triangle[0], triangle[1], triangle[2], false)
        return
      }
      if (oceanCorners === 3) {
        emitRefinedTriangle(triangle[0], triangle[1], triangle[2], true)
        return
      }

      const land = clip(triangle, false)
      const ocean = clip(triangle, true)
      emitPolygon(land, false)
      emitPolygon(ocean, true)
      for (let index = 0; index < land.length; index += 1) {
        const a = land[index]
        const b = land[(index + 1) % land.length]
        if (a.boundary && b.boundary) emitSkirt(a, b)
      }
    }

    for (let i = 0; i < refinement; i += 1) {
      for (let j = 0; j < refinement - i; j += 1) {
        const a = getLatticeVertex(i, j)
        const b = getLatticeVertex(i + 1, j)
        const c = getLatticeVertex(i, j + 1)
        processRefinedTriangle([a, b, c])
        if (i + j <= refinement - 2) {
          processRefinedTriangle([b, getLatticeVertex(i + 1, j + 1), c])
        }
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('aLandWeight', new Float32BufferAttribute(landWeights, 1))
  geometry.setAttribute('aOceanFloor', new Float32BufferAttribute(oceanFloors, 1))
  geometry.setIndex(indices)
  stats.vertexCount = positions.length / 3
  geometry.userData.coastGeometryStats = { ...stats }
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
