import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  NoColorSpace,
  RedFormat,
  RepeatWrapping,
  UnsignedByteType,
} from 'three'
import type { BufferGeometry, SphereGeometry, Texture } from 'three'
import { buildCoastGeometry } from './coastGeometry'
import { imagePixels, oceanMaskField, type ScalarField } from './terrainFields'

export interface CoastGeometrySet {
  generation: number
  levels: BufferGeometry[]
  oceanMask: Texture
}

interface CachedSet extends CoastGeometrySet {
  heightImage: unknown
  waterImage: unknown
  bathymetryImage: unknown
  uvOffset: number
  seaLevelTexel: number
  geometries: readonly SphereGeometry[]
}

let cached: CachedSet | null = null
let generation = 0

function oceanMaskTexture(field: ScalarField): DataTexture {
  const bytes = new Uint8Array(field.data.length)
  // DataTexture's first row is the bottom of the uploaded image. Store south to
  // north so shader UV v=1 samples the northern source row without flip tricks.
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const source = (field.height - 1 - y) * field.width + x
      bytes[y * field.width + x] = Math.round(Math.max(0, Math.min(1, field.data[source])) * 255)
    }
  }
  const texture = new DataTexture(bytes, field.width, field.height, RedFormat, UnsignedByteType)
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.flipY = false
  texture.colorSpace = NoColorSpace
  texture.unpackAlignment = 1
  texture.needsUpdate = true
  return texture
}

function disposeSet(set: CoastGeometrySet | null): void {
  if (!set) return
  for (const geometry of set.levels) geometry.dispose()
  set.oceanMask.dispose()
}

/** Builds and caches Earth's coast-conforming LODs from one uploaded map generation. */
export function getCoastGeometrySet(
  heightMap: Texture,
  waterMask: Texture,
  bathymetryMap: Texture,
  uvOffset: number,
  seaLevelTexel: number,
  geometries: readonly SphereGeometry[],
): CoastGeometrySet | null {
  const heightImage = heightMap.image as unknown
  const waterImage = waterMask.image as unknown
  const bathymetryImage = bathymetryMap.image as unknown
  if (
    cached &&
    cached.heightImage === heightImage &&
    cached.waterImage === waterImage &&
    cached.bathymetryImage === bathymetryImage &&
    cached.uvOffset === uvOffset &&
    cached.seaLevelTexel === seaLevelTexel &&
    cached.geometries === geometries
  ) {
    return cached
  }

  const elevation = imagePixels(heightMap)
  const water = imagePixels(waterMask)
  const bathymetry = water ? imagePixels(bathymetryMap, water.width, water.height) : null
  if (!elevation || !water || !bathymetry) return null

  const oceanField = oceanMaskField(elevation, water, bathymetry, seaLevelTexel)
  const next: CachedSet = {
    levels: geometries.map((geometry) => {
      const refinement = Math.min(
        16,
        Math.max(4, Math.ceil(water.width / geometry.parameters.widthSegments)),
      )
      return buildCoastGeometry(geometry, elevation, water, bathymetry, uvOffset, seaLevelTexel, refinement, oceanField)
    }),
    oceanMask: oceanMaskTexture(oceanField),
    generation: ++generation,
    heightImage,
    waterImage,
    bathymetryImage,
    uvOffset,
    seaLevelTexel,
    geometries,
  }
  disposeSet(cached)
  cached = next
  return cached
}

export function disposeCoastGeometrySet(): void {
  disposeSet(cached)
  cached = null
}
