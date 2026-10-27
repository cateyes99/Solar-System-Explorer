import { Color, Vector3 } from 'three'
import type { Texture } from 'three'
import type { SeafloorVisuals, TerrainVisuals } from '../../data/visuals'
import { EARTH_RADIUS_M, seafloorDepthRadius } from '../../utils/seawater'

/**
 * The solid Earth: land relief, and the seafloor the ocean sits on.
 *
 * Earth is the only body with an elevation model, so this is deliberately a
 * small, Earth-shaped module rather than a general terrain system. The surface
 * mesh carries the land (displaced up by the land DEM) *and* the seafloor
 * (displaced down by the bathymetry grid), and one shader serves both ocean
 * implementations (see `data/seawaterModes.ts`):
 *
 *  - **Surface** (the default): `uSeawaterOpacity` follows the panel slider, so
 *    the ocean fades in place — the floor sinks into view and its colour is
 *    revealed through a nominal, Beer's-law water column.
 *  - **Volumetric**: the floor is pinned fully drained (`uSeawaterOpacity` = 0)
 *    and a separate transparent water mesh (`water.ts` / `Ocean.tsx`) is drawn
 *    above it, so the slider only thins that layer.
 *
 * Because the two modes differ only in the value handed to that one uniform, the
 * shader is shared: at `uSeawaterOpacity` = 0 every seafloor term below reduces
 * exactly to "the floor, fully revealed".
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
   * the land's "Terrain relief", so the drained ocean can be dialled in alone.
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
    /**
     * How opaque the surface's ocean is: 1 keeps the flat, photographic ocean
     * (every seafloor term is skipped), 0 shows the floor fully. It is the panel
     * slider in the "surface" mode and a pinned 0 in the "volumetric" mode.
     */
    uSeawaterOpacity: { value: number }
    uSeafloorRoughness: { value: number }
    uSeafloorBumpScale: { value: number }
    /** The reveal curve's exponent (`(1 − opacity) ^ gamma`). */
    uSeafloorRevealGamma: { value: number }
    /** Per-channel Beer–Lambert extinction (linear RGB). */
    uSeafloorAbsorption: { value: Vector3 }
    /** The colour the water column scatters toward. */
    uSeafloorWaterTint: { value: Color }
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

/** A body's seafloor binding: what it looks like, its maps and its live dials. */
export interface SeafloorBinding {
  visuals: SeafloorVisuals
  maps: SeafloorMaps
  /** The seafloor-relief slider, 0…1. */
  relief: number
  /**
   * The surface's seawater opacity, 0…1. 1 leaves the flat photographic ocean
   * and 0 drains it. It is the panel slider in the "surface" mode and a pinned 0
   * in the "volumetric" mode, where the water layer carries the opacity.
   */
  opacity: number
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
      uSeawaterOpacity: { value: seafloor?.opacity ?? 1 },
      uSeafloorRoughness: { value: seafloor?.visuals.roughness ?? 1 },
      // The bump strength needs the planet's drawn radius, which only the caller
      // knows, so it is set alongside `material.bumpScale` (see `Planet.tsx`).
      uSeafloorBumpScale: { value: 0 },
      uSeafloorRevealGamma: { value: seafloor?.visuals.revealGamma ?? 1 },
      uSeafloorAbsorption: {
        value: seafloor
          ? new Vector3(...seafloor.visuals.absorption)
          : new Vector3(0, 0, 0),
      },
      uSeafloorWaterTint: { value: new Color(seafloor?.visuals.waterTint ?? '#000000') },
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
uniform float uSeafloorRevealGamma;
uniform float uSeawaterOpacity;
uniform float uBathyEnabled;
varying vec2 vSeaUv;
`

/**
 * Sinks the ocean floor by the bathymetry, scaled by the seafloor-relief slider
 * and gated by the seawater opacity. At 100% opacity the term is exactly zero,
 * so the ocean is the same flat sphere it has always been; at 0% the floor drops
 * to its true (exaggerated) depth. Land texels are zero, so the continents never
 * move.
 *
 * The drop follows the same `(1 − opacity) ^ revealGamma` curve as the colour,
 * so the geometry and the shading always agree on how drained the ocean is. In
 * the "volumetric" mode `uSeawaterOpacity` is pinned to 0, which makes the term
 * the full drop — the floor simply always sits at the bottom of the water column.
 */
export const SEAFLOOR_VERTEX_DISPLACE = /* glsl */ `
vSeaUv = uv;
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  float bathyTexel = texture2D(uBathyMap, uv + vec2(uTerrainUvOffset, 0.0)).r;
  float seaDepth = pow(bathyTexel, uSeafloorExponent);
  float drained = pow(1.0 - uSeawaterOpacity, uSeafloorRevealGamma);
  transformed += normalize(position) * (-seaDepth * uSeafloorScale * drained);
}
`

/** The seafloor's fragment uniforms and the shared "how much is revealed" term. */
export const SEAFLOOR_FRAGMENT_PARS = /* glsl */ `
uniform sampler2D uBathyMap;
uniform sampler2D uWaterMask;
uniform sampler2D uSeafloorRamp;
uniform float uSeafloorExponent;
uniform float uSeawaterOpacity;
uniform float uSeafloorRoughness;
uniform float uSeafloorBumpScale;
uniform float uSeafloorRevealGamma;
uniform vec3 uSeafloorAbsorption;
uniform vec3 uSeafloorWaterTint;
uniform float uBathyEnabled;
uniform float uTerrainUvOffset;
varying vec2 vSeaUv;

// The depth fraction at a seafloor UV: 0 at sea level, 1 at the deepest point.
float seafloorDepthAt(vec2 seaUv) {
  return pow(texture2D(uBathyMap, seaUv).r, uSeafloorExponent);
}

// How much of this pixel is ocean showing the floor through it: 0 on land and 0
// at 100% opacity, 1 where the water is fully drained. The revealGamma curve
// bends the middle of the slider (see SeafloorVisuals), and is exactly 0 and 1
// at the endpoints either way.
float seafloorReveal(vec2 seaUv) {
  float water = texture2D(uWaterMask, seaUv).a;
  return clamp(water * pow(1.0 - uSeawaterOpacity, uSeafloorRevealGamma), 0.0, 1.0);
}

// Beer–Lambert transmittance of the water column, per channel. The optical path
// grows toward the limb — a grazing view crosses far more water — and red is
// absorbed first, so the floor fades to a blue haze both with depth and at the
// edge of the disc. The coefficients are scaled for visibility, not calibrated.
vec3 seafloorTransmittance(vec2 seaUv) {
  float seaDepth = seafloorDepthAt(seaUv);
  float cosTheta = clamp(dot(normalize(vViewPosition), normalize(vNormal)), 0.12, 1.0);
  vec3 opticalDepth = uSeafloorAbsorption * seaDepth * uSeawaterOpacity / cosTheta;
  return exp(-opticalDepth);
}

// How much of the floor survives the water, as one 0…1 weight for the shading
// terms (the colour blend uses the full per-channel transmittance instead).
float seafloorVisibility(vec2 seaUv) {
  return clamp(dot(seafloorTransmittance(seaUv), vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
}
`

/**
 * Replaces the ocean's colour with the seafloor's as the water drains. Injected
 * after `map_fragment`, so the result is still lit and shaded normally. At 100%
 * opacity `reveal` is 0 and `diffuseColor` is untouched.
 */
export const SEAFLOOR_COLOR_BLEND = /* glsl */ `
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  vec3 transmittance = seafloorTransmittance(seaUv);
  vec3 seafloorColor = texture2D(uSeafloorRamp, vec2(seafloorDepthAt(seaUv), 0.5)).rgb;
  // What the eye actually receives: the floor, attenuated, plus the light the
  // water column itself scatters back toward the camera.
  vec3 throughWater = seafloorColor * transmittance + uSeafloorWaterTint * (1.0 - transmittance);
  diffuseColor.rgb = mix(diffuseColor.rgb, throughWater, seafloorReveal(seaUv));
}
`

/**
 * Fades the ocean's glassy sun glint out as the water drains: the floor is matte,
 * so its roughness takes over from the water's. Injected after
 * `roughnessmap_fragment`.
 */
export const SEAFLOOR_ROUGHNESS_BLEND = /* glsl */ `
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  roughnessFactor = mix(
    roughnessFactor,
    uSeafloorRoughness,
    seafloorReveal(seaUv) * seafloorVisibility(seaUv)
  );
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
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  // The relief fades with the light that survives the water, so a deep or
  // grazing view of the floor is as smooth as it looks.
  float strength = seafloorReveal(seaUv) * seafloorVisibility(seaUv);
  if (strength > 0.002) {
    vec2 dSTdx = dFdx(seaUv);
    vec2 dSTdy = dFdy(seaUv);
    float h0 = seafloorDepthAt(seaUv);
    float hx = seafloorDepthAt(seaUv + dSTdx);
    float hy = seafloorDepthAt(seaUv + dSTdy);
    // The surface's *outward* relief is the negative of the stored depth.
    vec2 gradient = -vec2(hx - h0, hy - h0) * uSeafloorBumpScale;
    vec3 bumped = perturbNormalArb(-vViewPosition, normal, gradient, faceDirection);
    normal = normalize(mix(normal, bumped, strength));
  }
}
#endif
`
