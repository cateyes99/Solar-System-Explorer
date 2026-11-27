import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  NearestFilter,
  NoColorSpace,
  RedFormat,
  RepeatWrapping,
  UnsignedByteType,
} from 'three'
import type { SphereGeometry, Texture } from 'three'

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Minimum DEM filter and dry coastal-apron widths, in uploaded texels. */
export const TERRAIN_FILTER_MIN_TEXELS = 2
export const TERRAIN_COAST_APRON_MIN_TEXELS = 4

/** A scalar, top-down equirectangular field, with values in the 0…1 range. */
export interface ScalarField {
  width: number
  height: number
  data: Float32Array
}

/** The two fields sampled at the vertices of one actual sphere geometry. */
export interface TerrainLevelFields {
  columns: number
  rows: number
  /** Area-filtered elevation, one value per geometry vertex. */
  heights: Float32Array
  /** Conservative coastal relief weight, one value per geometry vertex. */
  weights: Uint8Array
  heightTexture: DataTexture
  weightTexture: DataTexture
}

export interface TerrainFieldSet {
  /** Changes whenever the source images are rebuilt, for CPU-sampler invalidation. */
  generation: number
  levels: TerrainLevelFields[]
}

/**
 * Summed-area table for exact rectangular queries. Longitude is periodic;
 * latitude is clamped. Rectangle coordinates are normalized, top-down UV.
 */
class IntegralField {
  readonly field: ScalarField
  private readonly sums: Float64Array
  private readonly stride: number

  constructor(field: ScalarField) {
    this.field = field
    this.stride = field.width + 1
    this.sums = new Float64Array((field.width + 1) * (field.height + 1))
    for (let y = 0; y < field.height; y += 1) {
      for (let x = 0; x < field.width; x += 1) {
        const index = (y + 1) * this.stride + x + 1
        this.sums[index] =
          field.data[y * field.width + x] +
          this.sums[index - this.stride] +
          this.sums[index - 1] -
          this.sums[index - this.stride - 1]
      }
    }
  }

  private rowsSum(x0: number, x1: number, y0: number, y1: number): number {
    if (x1 <= x0 || y1 <= y0) return 0
    const stride = this.stride
    return (
      this.sums[y1 * stride + x1] -
      this.sums[y0 * stride + x1] -
      this.sums[y1 * stride + x0] +
      this.sums[y0 * stride + x0]
    )
  }

  /** Sum over whole source texels covering the requested rectangle. */
  sum(u0: number, v0: number, u1: number, v1: number): number {
    const { width, height } = this.field
    const y0 = Math.max(0, Math.min(height, Math.floor(Math.min(v0, v1) * height)))
    const y1 = Math.max(0, Math.min(height, Math.ceil(Math.max(v0, v1) * height)))
    if (y1 <= y0) return 0

    const left = Math.floor(Math.min(u0, u1) * width)
    const right = Math.ceil(Math.max(u0, u1) * width)
    const count = right - left
    if (count <= 0) return 0
    if (count >= width) return this.rowsSum(0, width, y0, y1)

    const x = ((left % width) + width) % width
    const first = Math.min(count, width - x)
    return this.rowsSum(x, x + first, y0, y1) + this.rowsSum(0, count - first, y0, y1)
  }

  average(u0: number, v0: number, u1: number, v1: number): number {
    const { width, height } = this.field
    const xCount = Math.ceil(Math.max(u0, u1) * width) - Math.floor(Math.min(u0, u1) * width)
    const yCount =
      Math.max(0, Math.min(height, Math.ceil(Math.max(v0, v1) * height))) -
      Math.max(0, Math.min(height, Math.floor(Math.min(v0, v1) * height)))
    const count = Math.max(1, xCount * yCount)
    return this.sum(u0, v0, u1, v1) / count
  }
}

function fieldTexture(data: Float32Array | Uint8Array, width: number, height: number, floating: boolean): DataTexture {
  const texture = new DataTexture(
    data,
    width,
    height,
    RedFormat,
    floating ? FloatType : UnsignedByteType,
  )
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.generateMipmaps = false
  texture.flipY = false
  texture.colorSpace = NoColorSpace
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}

function gridIndex(columns: number, row: number, column: number): number {
  // The two seam columns receive identical values during baking. Address either
  // one through the first so negative/out-of-range overlay corners also wrap.
  const wrapped = ((column % columns) + columns) % columns
  return row * (columns + 1) + wrapped
}

function triangleHasWater(
  water: IntegralField,
  uv: { getX(index: number): number; getY(index: number): number },
  a: number,
  b: number,
  c: number,
  uvOffset: number,
): boolean {
  const indices = [a, b, c]
  const longitudes = indices.map((index) => uv.getX(index) + uvOffset)
  // Unwrap around the first corner before taking bounds. A shifted triangle can
  // straddle 0/1 even though its sphere UVs looked perfectly ordinary.
  for (let index = 1; index < 3; index += 1) {
    while (longitudes[index] - longitudes[0] > 0.5) longitudes[index] -= 1
    while (longitudes[index] - longitudes[0] < -0.5) longitudes[index] += 1
  }
  const latitudes = indices.map((index) => 1 - uv.getY(index))
  const paddingU = 1 / water.field.width
  const paddingV = 1 / water.field.height
  return (
    water.sum(
      Math.min(...longitudes) - paddingU,
      Math.min(...latitudes) - paddingV,
      Math.max(...longitudes) + paddingU,
      Math.max(...latitudes) + paddingV,
    ) > 0
  )
}

/**
 * Builds the two fields directly from a sphere's actual UVs and index buffer.
 * Every triangle whose expanded UV footprint contains water gets three exactly
 * zero land-relief weights. The dry apron is added afterwards without ever
 * smoothing across or reopening that blocked set.
 */
export function buildTerrainLevelFields(
  geometry: SphereGeometry,
  elevation: ScalarField,
  waterField: ScalarField,
  uvOffset: number,
): TerrainLevelFields {
  const columns = geometry.parameters.widthSegments
  const rows = geometry.parameters.heightSegments
  const stride = columns + 1
  const count = stride * (rows + 1)
  const heights = new Float32Array(count)
  const weights = new Uint8Array(count)
  const blocked = new Uint8Array(count)
  const uv = geometry.getAttribute('uv')
  const indices = geometry.index?.array
  const heightsIntegral = new IntegralField(elevation)
  const waterIntegral = new IntegralField(waterField)

  const cellU = Math.max(1 / columns, TERRAIN_FILTER_MIN_TEXELS / elevation.width)
  const cellV = Math.max(1 / rows, TERRAIN_FILTER_MIN_TEXELS / elevation.height)
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const index = row * stride + column
      if (row === 0 || row === rows) {
        // All longitudes coincide at a pole. Use one canonical full-longitude
        // strip average for both height and (below) coast weight.
        const north = row === 0
        heights[index] = heightsIntegral.average(
          0,
          north ? 0 : 1 - cellV * 0.5,
          1,
          north ? cellV * 0.5 : 1,
        )
      } else {
        const mapU = uv.getX(index) + uvOffset
        const topDownV = 1 - uv.getY(index)
        heights[index] = heightsIntegral.average(
          mapU - cellU * 0.5,
          topDownV - cellV * 0.5,
          mapU + cellU * 0.5,
          topDownV + cellV * 0.5,
        )
      }
    }
  }

  if (indices) {
    for (let offset = 0; offset < indices.length; offset += 3) {
      const a = indices[offset]
      const b = indices[offset + 1]
      const c = indices[offset + 2]
      if (!triangleHasWater(waterIntegral, uv, a, b, c, uvOffset)) continue
      blocked[a] = 1
      blocked[b] = 1
      blocked[c] = 1
    }
  }

  // Seam duplicates and coincident pole groups are logical single vertices.
  for (let row = 0; row <= rows; row += 1) {
    const first = row * stride
    const last = first + columns
    const seamBlocked = blocked[first] | blocked[last]
    blocked[first] = seamBlocked
    blocked[last] = seamBlocked
    const seamHeight = 0.5 * (heights[first] + heights[last])
    heights[first] = seamHeight
    heights[last] = seamHeight
  }
  for (const row of [0, rows]) {
    let poleBlocked = 0
    for (let column = 0; column <= columns; column += 1) poleBlocked |= blocked[row * stride + column]
    const poleHeight = heights[row * stride]
    for (let column = 0; column <= columns; column += 1) {
      blocked[row * stride + column] = poleBlocked
      heights[row * stride + column] = poleHeight
    }
  }

  // Grid-space distance to the blocked set, periodic in longitude. Only this
  // outer dry distance is smoothed; blocked zeros are restored verbatim below.
  const distance = new Float32Array(count)
  for (let index = 0; index < count; index += 1) distance[index] = blocked[index] ? 0 : Number.POSITIVE_INFINITY
  const relax = (index: number, neighbour: number, cost: number): void => {
    const candidate = distance[neighbour] + cost
    if (candidate < distance[index]) distance[index] = candidate
  }
  const diagonal = Math.SQRT2
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const index = row * stride + column
      relax(index, row * stride + ((column - 1 + columns) % columns), 1)
      if (row > 0) {
        relax(index, index - stride, 1)
        relax(index, (row - 1) * stride + ((column - 1 + columns) % columns), diagonal)
        relax(index, (row - 1) * stride + ((column + 1) % columns), diagonal)
      }
    }
  }
  for (let row = rows; row >= 0; row -= 1) {
    for (let column = columns; column >= 0; column -= 1) {
      const index = row * stride + column
      relax(index, row * stride + ((column + 1) % columns), 1)
      if (row < rows) {
        relax(index, index + stride, 1)
        relax(index, (row + 1) * stride + ((column + 1) % columns), diagonal)
        relax(index, (row + 1) * stride + ((column - 1 + columns) % columns), diagonal)
      }
    }
  }

  const texelsPerCell = Math.max(elevation.width / columns, elevation.height / rows)
  const apronCells = Math.max(1, TERRAIN_COAST_APRON_MIN_TEXELS / texelsPerCell)
  for (let index = 0; index < count; index += 1) {
    weights[index] = blocked[index]
      ? 0
      : Math.round(255 * smoothstep(0, apronCells, distance[index]))
  }

  // Enforce identical final values after the apron as well. Most importantly,
  // no filtering or smoothing can turn a blocked corner back into a positive one.
  for (let row = 0; row <= rows; row += 1) {
    const first = row * stride
    const last = first + columns
    const value = weights[first]
    weights[last] = value
  }
  for (const row of [0, rows]) {
    let value = 255
    for (let column = 0; column <= columns; column += 1) {
      value = Math.min(value, weights[row * stride + column])
    }
    for (let column = 0; column <= columns; column += 1) weights[row * stride + column] = value
  }

  return {
    columns,
    rows,
    heights,
    weights,
    heightTexture: fieldTexture(heights, stride, rows + 1, true),
    weightTexture: fieldTexture(weights, stride, rows + 1, false),
  }
}

export function buildTerrainFieldSet(
  elevation: ScalarField,
  water: ScalarField,
  uvOffset: number,
  geometries: readonly SphereGeometry[],
): Omit<TerrainFieldSet, 'generation'> {
  return {
    levels: geometries.map((geometry) => buildTerrainLevelFields(geometry, elevation, water, uvOffset)),
  }
}

function imagePixels(texture: Texture): ScalarField | null {
  const source = texture.image as CanvasImageSource | undefined
  if (!source || typeof document === 'undefined') return null
  const image = source as {
    width?: number
    height?: number
    naturalWidth?: number
    naturalHeight?: number
  }
  const width = image.naturalWidth ?? image.width ?? 0
  const height = image.naturalHeight ?? image.height ?? 0
  if (width <= 0 || height <= 0) return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(source, 0, 0, width, height)
  const pixels = context.getImageData(0, 0, width, height).data
  const data = new Float32Array(width * height)
  for (let index = 0; index < data.length; index += 1) data[index] = pixels[index * 4] / 255
  return { width, height, data }
}

interface CachedFields extends TerrainFieldSet {
  heightImage: unknown
  waterImage: unknown
  uvOffset: number
  geometries: readonly SphereGeometry[]
}

let cached: CachedFields | null = null
let generation = 0

function disposeLevels(fields: TerrainFieldSet | null): void {
  if (!fields) return
  for (const level of fields.levels) {
    level.heightTexture.dispose()
    level.weightTexture.dispose()
  }
}

/**
 * Returns fields matching the current uploaded images. Quality rebuilds replace
 * those image objects, so the complete six-LOD set is regenerated and swapped in
 * together; the active level is then selected synchronously during render.
 */
export function getTerrainFields(
  heightMap: Texture,
  waterMask: Texture,
  uvOffset: number,
  geometries: readonly SphereGeometry[],
): TerrainFieldSet | null {
  const heightImage = heightMap.image as unknown
  const waterImage = waterMask.image as unknown
  if (
    cached &&
    cached.heightImage === heightImage &&
    cached.waterImage === waterImage &&
    cached.uvOffset === uvOffset &&
    cached.geometries === geometries
  ) {
    return cached
  }
  const elevation = imagePixels(heightMap)
  const water = imagePixels(waterMask)
  if (!elevation || !water) return null
  const next: CachedFields = {
    ...buildTerrainFieldSet(elevation, water, uvOffset, geometries),
    generation: ++generation,
    heightImage,
    waterImage,
    uvOffset,
    geometries,
  }
  disposeLevels(cached)
  cached = next
  return cached
}

export function disposeTerrainFields(): void {
  disposeLevels(cached)
  cached = null
}

/** GLSL addressing for the per-geometry field textures, including pole UV shifts. */
export const TERRAIN_FIELD_UV_GLSL = /* glsl */ `
vec2 terrainFieldUv(vec2 sphereUv, vec2 meshSegments) {
  float row = floor((1.0 - sphereUv.y) * meshSegments.y + 0.5);
  float columnCoordinate = sphereUv.x * meshSegments.x;
  if (row < 0.5) columnCoordinate -= 0.5;
  else if (row > meshSegments.y - 0.5) columnCoordinate += 0.5;
  float column = floor(columnCoordinate + 0.0001);
  return vec2(
    (column + 0.5) / (meshSegments.x + 1.0),
    (row + 0.5) / (meshSegments.y + 1.0)
  );
}
`

export interface TerrainOffsetSample {
  /** Interpolated filteredHeight × weight. */
  height: number
  /** Interpolated weight. The final rise is height × scale + taper × bias. */
  taper: number
}

/** CPU counterpart of the overlay shader's final per-corner interpolation. */
export function sampleTerrainLevelAt(
  level: TerrainLevelFields,
  uvOffset: number,
  mapU: number,
  mapV: number,
): TerrainOffsetSample {
  const { columns, rows } = level
  const wrappedU = (((mapU - uvOffset) % 1) + 1) % 1
  const gu = wrappedU * columns
  const gv = Math.min(Math.max((1 - mapV) * rows, 0), rows - 1e-6)
  const iu = Math.floor(gu)
  const iv = Math.floor(gv)
  const au = gu - iu
  const av = gv - iv
  const corner = (row: number, column: number): { height: number; weight: number } => {
    const index = gridIndex(columns, Math.max(0, Math.min(rows, row)), column)
    return { height: level.heights[index], weight: level.weights[index] / 255 }
  }
  const a = corner(iv, iu + 1)
  const b = corner(iv, iu)
  const c = corner(iv + 1, iu)
  const d = corner(iv + 1, iu + 1)
  const northCap = iv < 0.5
  const southCap = iv > rows - 1.5
  const abd = southCap || (!northCap && au >= av)
  const weights = abd
    ? { a: au - av, b: 1 - au, c: 0, d: av }
    : { a: 0, b: 1 - av, c: av - au, d: au }
  const sample = (corner: { height: number; weight: number }, share: number) => ({
    height: corner.height * corner.weight * share,
    taper: corner.weight * share,
  })
  const sa = sample(a, weights.a)
  const sb = sample(b, weights.b)
  const sc = sample(c, weights.c)
  const sd = sample(d, weights.d)
  return {
    height: sa.height + sb.height + sc.height + sd.height,
    taper: sa.taper + sb.taper + sc.taper + sd.taper,
  }
}

/** The geometry tier whose segment counts match an overlay's requested mesh. */
export function terrainLevelForMesh(
  fields: TerrainFieldSet | null,
  columns: number,
  rows: number,
): TerrainLevelFields | null {
  return fields?.levels.find((level) => level.columns === columns && level.rows === rows) ?? null
}

/** Tests and CPU-side geometry checks can inspect a field without a renderer. */
export function terrainVertexFieldUv(
  u: number,
  v: number,
  columns: number,
  rows: number,
): { u: number; v: number } {
  const row = Math.floor((1 - v) * rows + 0.5)
  let coordinate = u * columns
  if (row < 0.5) coordinate -= 0.5
  else if (row > rows - 0.5) coordinate += 0.5
  const column = Math.floor(coordinate + 0.0001)
  return { u: (column + 0.5) / (columns + 1), v: (row + 0.5) / (rows + 1) }
}

