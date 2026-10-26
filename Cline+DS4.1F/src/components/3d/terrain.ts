import type { Texture } from 'three'
import type { SeafloorVisuals, TerrainVisuals } from '../../data/visuals'
import { EARTH_RADIUS_M, seafloorDepthRadius } from '../../utils/seawater'

/**
 * The solid Earth: land relief, and the seafloor that the ocean layer sits on.
 *
 * Earth is the only body with an elevation model, so this is deliberately a
 * small, Earth-shaped module rather than a general terrain system. The surface
 * mesh carries the land (displaced up by the land DEM) *and* the seafloor
 * (displaced down by the bathymetry grid), and is always drawn fully drained —
 * the water itself is a separate transparent layer (see `water.ts`), so the
 * floor simply sits at the bottom of the water column and is revealed as the
 * ocean thins.
 */

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
 * land rises above it. The exaggeration is what makes any of this visible at all
 * — the true relief is 0.14% of Earth's radius, a fraction of a pixel on a globe
 * that fills the screen — and it is disclosed in the UI.
 */
export function terrainDisplacement(terrain: TerrainVisuals, relief: number): TerrainRelief {
  const exaggeration = terrain.maxExaggeration * Math.max(0, relief)
  const peakRadius = (terrain.peakElevationM / EARTH_RADIUS_M) * exaggeration
  const span = Math.max(terrain.peakTexel - terrain.seaLevelTexel, 1e-4)
  const scale = peakRadius / span
  return { peakRadius, scale, bias: -terrain.seaLevelTexel * scale }
}

export interface SeafloorRelief {
  /**
   * How far the deepest water lies below sea level, as a fraction of the
   * planet's radius. The seafloor's own relief slider sets it, independently of
   * the land's "Terrain relief".
   */
  maxDepthRadius: number
}

/**
 * The seafloor's displacement numbers. The stored depth is a 0…1 *fraction* (the
 * shader inverts the map's square-root curve), so the object-space displacement
 * of a fragment is simply `−depthFraction × maxDepthRadius`.
 */
export function seafloorDisplacement(seafloor: SeafloorVisuals, relief: number): SeafloorRelief {
  return {
    maxDepthRadius: seafloorDepthRadius(
      seafloor.maxDepthMeters,
      seafloor.maxExaggeration,
      relief,
    ),
  }
}

/**
 * The elevation and seafloor fields as a set of shader uniforms.
 *
 * They are held as plain `{ value }` objects so that a per-frame update is a
 * single assignment and never a shader rebuild, and they are shared with the
 * city lights so the two agree on where the ground is.
 */
export interface TerrainUniforms {
  map: Texture
  uniforms: {
    uTerrainMap: { value: Texture }
    uTerrainScale: { value: number }
    uTerrainBias: { value: number }
    uTerrainUvOffset: { value: number }
    /* Seafloor (Earth only; inert while uBathyEnabled is 0) */
    uBathyMap: { value: Texture }
    uWaterMask: { value: Texture }
    uSeafloorRamp: { value: Texture }
    uSeafloorScale: { value: number }
    uSeafloorExponent: { value: number }
    uSeafloorRoughness: { value: number }
    uSeafloorBumpScale: { value: number }
    uBathyEnabled: { value: number }
  }
}

/** The maps the seafloor needs, all shared with the rest of the scene. */
export interface SeafloorMaps {
  /** The grayscale depth field (0 = sea level, 255 = the deepest point). */
  bathymetry: Texture
  /** The water mask, carried in the alpha channel of the ocean roughness map. */
  waterMask: Texture
  /** The 1-D depth ramp. */
  ramp: Texture
}

/** A body's seafloor binding: what it looks like, its maps and its relief dial. */
export interface SeafloorBinding {
  visuals: SeafloorVisuals
  maps: SeafloorMaps
  /** The seafloor-relief slider, 0…1. */
  relief: number
  /** 1 when a real bathymetry map loaded, 0 when it is missing (feature off). */
  enabled: boolean
}

export function createTerrainUniforms(
  terrain: TerrainVisuals,
  map: Texture,
  relief: number,
  uvOffset: number,
  seafloor: SeafloorBinding | null = null,
): TerrainUniforms {
  const start = terrainDisplacement(terrain, relief)
  const floor = seafloor ? seafloorDisplacement(seafloor.visuals, seafloor.relief) : null
  return {
    map,
    uniforms: {
      uTerrainMap: { value: map },
      uTerrainScale: { value: start.scale },
      uTerrainBias: { value: start.bias },
      uTerrainUvOffset: { value: uvOffset },
      uBathyMap: { value: seafloor?.maps.bathymetry ?? map },
      uWaterMask: { value: seafloor?.maps.waterMask ?? map },
      uSeafloorRamp: { value: seafloor?.maps.ramp ?? map },
      uSeafloorScale: { value: floor?.maxDepthRadius ?? 0 },
      uSeafloorExponent: { value: seafloor?.visuals.depthExponent ?? 2 },
      uSeafloorRoughness: { value: seafloor?.visuals.roughness ?? 1 },
      // The bump strength needs the planet's drawn radius, which only the caller
      // knows, so it is set alongside `material.bumpScale` (see `Planet.tsx`).
      uSeafloorBumpScale: { value: 0 },
      uBathyEnabled: { value: seafloor?.enabled ? 1 : 0 },
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
 * The land relief: the ground is pushed out along its own normal by the height
 * field, exactly as the map says. Sea level has a scale of zero, so the oceans
 * stay on the mean radius and only land moves.
 */
export const TERRAIN_VERTEX_DISPLACE = /* glsl */ `
{
  float terrainHeight = texture2D(uTerrainMap, uv + vec2(uTerrainUvOffset, 0.0)).x;
  transformed += normalize(position) * (terrainHeight * uTerrainScale + uTerrainBias);
}
`

/** The seafloor's own vertex uniforms (shared by the surface material only). */
export const SEAFLOOR_VERTEX_PARS = /* glsl */ `
uniform sampler2D uBathyMap;
uniform float uSeafloorScale;
uniform float uSeafloorExponent;
uniform float uBathyEnabled;
varying vec2 vSeaUv;
`

/**
 * Sinks the ocean floor by the bathymetry, scaled by the seafloor-relief slider.
 * It is always fully applied: the floor belongs at the bottom of the water
 * column whether or not the water above it is currently opaque. Land texels are
 * zero, so the continents never move.
 */
export const SEAFLOOR_VERTEX_DISPLACE = /* glsl */ `
vSeaUv = uv;
if (uBathyEnabled > 0.5) {
  float bathyTexel = texture2D(uBathyMap, uv + vec2(uTerrainUvOffset, 0.0)).r;
  float seaDepth = pow(bathyTexel, uSeafloorExponent);
  transformed += normalize(position) * (-seaDepth * uSeafloorScale);
}
`

/** The seafloor's fragment uniforms and its two shared helpers. */
export const SEAFLOOR_FRAGMENT_PARS = /* glsl */ `
uniform sampler2D uBathyMap;
uniform sampler2D uWaterMask;
uniform sampler2D uSeafloorRamp;
uniform float uSeafloorExponent;
uniform float uSeafloorRoughness;
uniform float uSeafloorBumpScale;
uniform float uBathyEnabled;
uniform float uTerrainUvOffset;
varying vec2 vSeaUv;

// The depth fraction at a seafloor UV: 0 at sea level, 1 at the deepest point.
float seafloorDepthAt(vec2 seaUv) {
  return pow(texture2D(uBathyMap, seaUv).r, uSeafloorExponent);
}

// How much of this pixel is seafloor at all: 1 over open water, 0 on land and
// fading across the coast. The water mask rides in the roughness map's alpha.
float seafloorReveal(vec2 seaUv) {
  return clamp(texture2D(uWaterMask, seaUv).a, 0.0, 1.0);
}
`

/**
 * Paints the drained seafloor: the ocean's texels become the depth ramp. Injected
 * after `map_fragment`, so the result is still lit and shaded normally. Land is
 * untouched — its mask is zero.
 */
export const SEAFLOOR_COLOR_BLEND = /* glsl */ `
if (uBathyEnabled > 0.5) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  vec3 seafloorColor = texture2D(uSeafloorRamp, vec2(seafloorDepthAt(seaUv), 0.5)).rgb;
  diffuseColor.rgb = mix(diffuseColor.rgb, seafloorColor, seafloorReveal(seaUv));
}
`

/**
 * The drained floor is matte, so its roughness takes over from the ocean's
 * glassy value. Injected after `roughnessmap_fragment`.
 */
export const SEAFLOOR_ROUGHNESS_BLEND = /* glsl */ `
if (uBathyEnabled > 0.5) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  roughnessFactor = mix(roughnessFactor, uSeafloorRoughness, seafloorReveal(seaUv));
}
`

/**
 * Shades the fine seafloor relief the coarse mesh cannot hold. The mesh has only
 * a few hundred segments across the whole globe — nowhere near enough to carry a
 * fracture zone — so the depth field's screen-space slope tilts the surface
 * normal, exactly the way three.js's own bump map does for the land. Injected
 * after `normal_fragment_maps`; it reuses `perturbNormalArb` from the standard
 * material's bump-map support, which Earth always has (its land height map).
 */
export const SEAFLOOR_NORMAL_BUMP = /* glsl */ `
#ifdef USE_BUMPMAP
if (uBathyEnabled > 0.5) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  float reveal = seafloorReveal(seaUv);
  if (reveal > 0.002) {
    vec2 dSTdx = dFdx(seaUv);
    vec2 dSTdy = dFdy(seaUv);
    float h0 = seafloorDepthAt(seaUv);
    float hx = seafloorDepthAt(seaUv + dSTdx);
    float hy = seafloorDepthAt(seaUv + dSTdy);
    // The surface's *outward* relief is the negative of the stored depth.
    vec2 gradient = -vec2(hx - h0, hy - h0) * uSeafloorBumpScale;
    vec3 bumped = perturbNormalArb(-vViewPosition, normal, gradient, faceDirection);
    normal = normalize(mix(normal, bumped, reveal));
  }
}
#endif
`
