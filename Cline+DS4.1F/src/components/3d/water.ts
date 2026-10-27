import { Color, Vector3 } from 'three'
import type { Texture } from 'three'
import type { WaterVisuals } from '../../data/visuals'

/**
 * The ocean surface's shader plumbing.
 *
 * The water is a **separate, genuinely transparent mesh** at sea level, drawn
 * over the seafloor mesh (`terrain.ts`), which now always sits at the bottom of
 * the water column. Nothing here fades the floor: the GPU blends the two layers
 * by the water's own alpha, so at 50% you are looking through a real liquid
 * surface at a real floor, with the parallax that comes from their being at
 * different radii.
 *
 * The material itself is a `MeshStandardMaterial`, so the water gets the scene's
 * proper PBR lighting, a specular response from its roughness and a rippled
 * normal map for free; these chunks only add the two things that are specific to
 * this app — the Beer's-law body colour and the per-fragment alpha.
 */

export interface WaterUniforms {
  uniforms: {
    uWaterMask: { value: Texture }
    uBathyMap: { value: Texture }
    uSeafloorExponent: { value: number }
    uUvOffset: { value: number }
    uWaterAlpha: { value: number }
    uWaterAbsorption: { value: Vector3 }
    uWaterTint: { value: Color }
  }
}

export interface WaterBinding {
  visuals: WaterVisuals
  /** The ocean roughness map; its **alpha** channel is the water mask. */
  waterMask: Texture
  /** The depth field, for Beer's law. */
  bathymetry: Texture
  depthExponent: number
  uvOffset: number
  /** The seawater-opacity slider, 0…1. */
  opacity: number
}

/**
 * The water layer's alpha for a slider value: `1 − (1 − opacity) ^ gamma`.
 * 100% → 1 (a fully opaque ocean), 0% → 0 (gone), and a mid slider already shows
 * most of the floor. It is a presentation curve — the panel note says the slider
 * is not a model of real underwater visibility.
 */
export function waterAlpha(opacity: number, revealGamma: number): number {
  const clamped = opacity < 0 ? 0 : opacity > 1 ? 1 : opacity
  return 1 - Math.pow(1 - clamped, revealGamma)
}

export function createWaterUniforms(binding: WaterBinding): WaterUniforms {
  return {
    uniforms: {
      uWaterMask: { value: binding.waterMask },
      uBathyMap: { value: binding.bathymetry },
      uSeafloorExponent: { value: binding.depthExponent },
      uUvOffset: { value: binding.uvOffset },
      uWaterAlpha: { value: waterAlpha(binding.opacity, binding.visuals.revealGamma) },
      uWaterAbsorption: { value: new Vector3(...binding.visuals.absorption) },
      uWaterTint: { value: new Color(binding.visuals.waterTint) },
    },
  }
}

/** The vertex side: one extra varying carrying the surface's own UV. */
export const WATER_VERTEX_PARS = /* glsl */ `
varying vec2 vSeaUv;
`

export const WATER_VERTEX_UV = /* glsl */ `
vSeaUv = uv;
`

export const WATER_FRAGMENT_PARS = /* glsl */ `
uniform sampler2D uWaterMask;
uniform sampler2D uBathyMap;
uniform float uSeafloorExponent;
uniform float uUvOffset;
uniform float uWaterAlpha;
uniform vec3 uWaterAbsorption;
uniform vec3 uWaterTint;
varying vec2 vSeaUv;
`

/**
 * Injected after `map_fragment`, so `diffuseColor` already holds the day map's
 * own ocean colour — the water keeps the planet's real hue and simply attenuates
 * it with depth. The alpha is the water mask (1 over open water, fading out
 * across the coast) times the slider's alpha.
 */
export const WATER_FRAGMENT_BODY = /* glsl */ `
{
  vec2 seaUv = vSeaUv + vec2(uUvOffset, 0.0);
  float waterMask = texture2D(uWaterMask, seaUv).a;
  if (waterMask * uWaterAlpha < 0.004) discard;
  float waterDepth = pow(texture2D(uBathyMap, seaUv).r, uSeafloorExponent);
  // Beer's law, per channel: the water body absorbs its own colour with depth,
  // so a shallow shelf stays the bright day-map blue while the abyss falls away
  // through teal to navy — driven by the real depth under each pixel.
  vec3 transmittance = exp(-uWaterAbsorption * waterDepth);
  diffuseColor.rgb = diffuseColor.rgb * transmittance + uWaterTint * (1.0 - transmittance);
  diffuseColor.a = waterMask * uWaterAlpha;
}
`
