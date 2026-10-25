import type { Texture } from 'three'
import type { TerrainVisuals } from '../../data/visuals'
import { EARTH_DIAMETER_KM } from '../../utils/scale'

/**
 * Real terrain relief, shared by everything that has to know where the ground
 * is: the surface itself and the city lights painted on it.
 *
 * Earth is the only body with an elevation model, so this is deliberately a
 * small, Earth-shaped module rather than a general terrain system. What it does
 * have to get right is that the two consumers are displaced by *exactly* the
 * same field — if they were not, the lights would sink into the mountains.
 */

/** Earth's mean radius in metres — the denominator of every relief fraction. */
const EARTH_RADIUS_M = (EARTH_DIAMETER_KM * 1000) / 2

export interface TerrainRelief {
  /**
   * How far the highest ground stands above the sea, as a fraction of the
   * planet's radius. This is the figure the shells around the surface — the
   * clouds, the haze, the city lights — have to clear.
   */
  peakRadius: number
  /** Displacement = texel × `scale` + `bias`, in object units (sphere radius 1). */
  scale: number
  bias: number
}

/**
 * Turns an elevation model plus a relief setting into the numbers the renderer
 * needs.
 *
 * The bias is chosen so that sea level lands exactly on the mean radius and only
 * land rises above it: the oceans therefore stay a smooth sphere, which is what
 * a sea is, and the bathymetry in the map is deliberately ignored. The
 * exaggeration is what makes any of this visible at all — the true relief is
 * 0.14% of Earth's radius, a fraction of a pixel on a globe that fills the
 * screen — and it is disclosed in the UI.
 */
export function terrainDisplacement(terrain: TerrainVisuals, relief: number): TerrainRelief {
  const exaggeration = terrain.maxExaggeration * Math.max(0, relief)
  const peakRadius = (terrain.peakElevationM / EARTH_RADIUS_M) * exaggeration
  const span = Math.max(terrain.peakTexel - terrain.seaLevelTexel, 1e-4)
  const scale = peakRadius / span
  return { peakRadius, scale, bias: -terrain.seaLevelTexel * scale }
}

/**
 * The elevation model as a set of shader uniforms.
 *
 * `map` is the height field itself (a grayscale equirectangular image); the
 * four uniforms are what the vertex shaders sample it through. They are held as
 * plain `{ value }` objects so that a per-frame update is a single assignment
 * and never a shader rebuild.
 */
export interface TerrainUniforms {
  map: Texture
  uniforms: {
    uTerrainMap: { value: Texture }
    uTerrainScale: { value: number }
    uTerrainBias: { value: number }
    uTerrainUvOffset: { value: number }
  }
}

export function createTerrainUniforms(
  terrain: TerrainVisuals,
  map: Texture,
  relief: number,
  uvOffset: number,
): TerrainUniforms {
  const start = terrainDisplacement(terrain, relief)
  return {
    map,
    uniforms: {
      uTerrainMap: { value: map },
      uTerrainScale: { value: start.scale },
      uTerrainBias: { value: start.bias },
      uTerrainUvOffset: { value: uvOffset },
    },
  }
}

/** The uniform declarations a vertex shader needs to read the elevation model. */
export const TERRAIN_VERTEX_PARS = /* glsl */ `
uniform sampler2D uTerrainMap;
uniform float uTerrainScale;
uniform float uTerrainBias;
uniform float uTerrainUvOffset;
`

/**
 * The displacement itself: the ground is pushed out along its own normal by the
 * height field, exactly as the map says. Sea level has a scale of zero, so the
 * oceans stay on the mean radius and only land moves.
 */
export const TERRAIN_VERTEX_DISPLACE = /* glsl */ `
{
  float terrainHeight = texture2D(uTerrainMap, uv + vec2(uTerrainUvOffset, 0.0)).x;
  transformed += normalize(position) * (terrainHeight * uTerrainScale + uTerrainBias);
}
`
