import { Color, Vector2, Vector3 } from 'three'
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
    /**
     * How far the sea surface has dropped, as a fraction of the ocean's full
     * depth (see `utils/seawater.ts`). It is the geometry counterpart of
     * `uWaterAlpha`: the mesh is also scaled to match, and this value both trims
     * the Beer's-law path to the remaining column and exposes the floor above
     * the new waterline.
     */
    uSeaLevelDrop: { value: number }
    uWaterAbsorption: { value: Vector3 }
    uWaterTint: { value: Color }
    /* Waves (see `utils/waves.ts`; all inert while the slider is low) */
    /** The detail layer's UV scale (a finer repeat of the same ripple map). */
    uWaveRepeat2: { value: Vector2 }
    /** The detail layer's scrolling UV offset, advanced each frame. */
    uWaveOffset2: { value: Vector2 }
    /** The detail layer's normal strength. */
    uWaveScale2: { value: number }
    /** The detail layer's blend weight, 0…1 (the slider's variability). */
    uWaveBlend: { value: number }
    /** A slowly advancing clock for the coastal surf animation, in seconds. */
    uWaveTime: { value: number }
    /** The coastal surf strength, 0…1 (the slider's coastal interaction). */
    uCoastal: { value: number }
    /** The colour the breaking surf is tinted with. */
    uFoamColor: { value: Color }
    /** How strongly the view/distance fade applies to the base ripples, 0…1. */
    uWaveFadeStrength: { value: number }
    /** The planet's drawn radius, for the scale-invariant distance fade. */
    uWaveRadius: { value: number }
    /** The view-angle fade range (facing cosines; see `WaterWaveVisuals`). */
    uWaveLimbFade: { value: Vector2 }
    /** The distance fade range (multiples of the radius). */
    uWaveDistanceFade: { value: Vector2 }
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
  /** How far the sea surface has dropped, 0…1 (see `utils/seawater.ts`). */
  seaLevelDrop: number
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
      uSeaLevelDrop: { value: binding.seaLevelDrop },
      uWaterAbsorption: { value: new Vector3(...binding.visuals.absorption) },
      uWaterTint: { value: new Color(binding.visuals.waterTint) },
      uWaveRepeat2: {
        value: new Vector2(
          binding.visuals.normalRepeat[0] * (binding.visuals.wave?.detailRepeatScale ?? 1),
          binding.visuals.normalRepeat[1] * (binding.visuals.wave?.detailRepeatScale ?? 1),
        ),
      },
      uWaveOffset2: { value: new Vector2(0, 0) },
      uWaveScale2: { value: binding.visuals.wave?.detailNormalScale ?? 0 },
      // Zero until the slider is dragged up: the detail layer and the surf are
      // invisible at the baseline, so the shipped look is preserved exactly.
      uWaveBlend: { value: 0 },
      uWaveTime: { value: 0 },
      uCoastal: { value: 0 },
      uFoamColor: { value: new Color(binding.visuals.wave?.foamColor ?? '#ffffff') },
      // Zero until the slider is above the baseline, so the shipped look is
      // never faded. `Ocean.tsx` keeps the radius live as the scale changes.
      uWaveFadeStrength: { value: 0 },
      uWaveRadius: { value: 1 },
      uWaveLimbFade: { value: new Vector2(...(binding.visuals.wave?.limbFade ?? [0.05, 0.35])) },
      uWaveDistanceFade: {
        value: new Vector2(...(binding.visuals.wave?.distanceFade ?? [30, 80])),
      },
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
uniform float uSeaLevelDrop;
uniform vec3 uWaterAbsorption;
uniform vec3 uWaterTint;
uniform vec2 uWaveRepeat2;
uniform vec2 uWaveOffset2;
uniform float uWaveScale2;
uniform float uWaveBlend;
uniform float uWaveTime;
uniform float uCoastal;
uniform vec3 uFoamColor;
uniform float uWaveFadeStrength;
uniform float uWaveRadius;
uniform vec2 uWaveLimbFade;
uniform vec2 uWaveDistanceFade;
varying vec2 vSeaUv;

/**
 * How much of the ripples survive at this fragment: 1 facing the camera and
 * close, easing to 0 at the limb and as the globe shrinks into the distance.
 *
 * The view angle is the cosine between the surface normal and the line of
 * sight (vViewPosition points from the fragment to the camera in view space),
 * so it is 1 dead centre and 0 at the very edge of the disc. The distance is
 * measured in planet radii, which makes it behave identically in every scale
 * mode. Both are combined so a finely tiled ripple map cannot smear at the limb
 * or shimmer on a distant globe.
 */
float waterRippleFade(vec3 viewNormal) {
  float facing = clamp(dot(normalize(vViewPosition), viewNormal), 0.0, 1.0);
  float limb = smoothstep(uWaveLimbFade.x, uWaveLimbFade.y, facing);
  float radii = length(vViewPosition) / max(uWaveRadius, 1e-5);
  float near = 1.0 - smoothstep(uWaveDistanceFade.x, uWaveDistanceFade.y, radii);
  return limb * near;
}
`

/**
 * Injected after `map_fragment`, so `diffuseColor` already holds the day map's
 * own ocean colour — the water keeps the planet's real hue and simply attenuates
 * it with depth. The alpha is the water mask (1 over open water, fading out
 * across the coast) times the slider's alpha.
 *
 * The sea-level drop trims the water column: `waterDepth` becomes the *filled*
 * depth, so the Beer's-law tint is measured through the water that is actually
 * there, and anything above the new waterline (where the floor now stands proud
 * of the lowered surface) is discarded, exposing the seafloor mesh beneath.
 */
export const WATER_FRAGMENT_BODY = /* glsl */ `
{
  vec2 seaUv = vSeaUv + vec2(uUvOffset, 0.0);
  float waterMask = texture2D(uWaterMask, seaUv).a;
  if (waterMask * uWaterAlpha < 0.004) discard;
  // The depth fraction under this pixel, minus how far the surface has dropped:
  // 0 exactly at the waterline, 1 where the column is still at full depth.
  float waterDepth = pow(texture2D(uBathyMap, seaUv).r, uSeafloorExponent) - uSeaLevelDrop;
  // Above the waterline the floor is exposed; the opaque seafloor mesh already
  // covers these pixels, so the water steps aside.
  if (waterDepth <= 0.0) discard;
  // Beer's law, per channel: the water body absorbs its own colour with depth,
  // so a shallow shelf stays the bright day-map blue while the abyss falls away
  // through teal to navy — driven by the real depth under each pixel.
  vec3 transmittance = exp(-uWaterAbsorption * waterDepth);
  diffuseColor.rgb = diffuseColor.rgb * transmittance + uWaterTint * (1.0 - transmittance);
  diffuseColor.a = waterMask * uWaterAlpha;
  // The coastal surf: a soft band on the *water* side of the shore, gated to
  // the shallows, brightened by an animated foam term. It is invisible until
  // the "Wave intensity" slider is well above its baseline (see utils/waves.ts),
  // so the shipped look is untouched. It is pure shading — the land never moves.
  if (uCoastal > 0.002) {
    float shoreBand = smoothstep(0.06, 0.42, waterMask) * (1.0 - smoothstep(0.42, 0.9, waterMask));
    float shallow = 1.0 - smoothstep(0.0, 0.16, waterDepth);
    float foam = uCoastal * shoreBand * shallow;
    // A slow pulse reads as surf rolling in and drawing back.
    foam *= 0.6 + 0.4 * sin(waterMask * 24.0 - uWaveTime * 2.1);
    // The surf fades out with the ripples, so it cannot smear into a bright ring
    // at the limb or on a distant globe (the surf only appears above the baseline).
    foam *= waterRippleFade(normalize(vNormal));
    foam = clamp(foam, 0.0, 1.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, uFoamColor, foam * 0.7);
    diffuseColor.a = min(1.0, diffuseColor.a + foam * 0.35);
  }
}
`

/**
 * The ripple layers' view/distance fade and the second, finer detail layer.
 * Injected after `normal_fragment_maps`, where the finished `normal`, the
 * geometric normal (`waterGeoNormal`, saved just before the standard chunk) and
 * the tangent frame `tbn` all exist.
 *
 * Two things happen here:
 *
 *  - **The fade.** `waterRippleFade` eases the ripples toward a smooth surface at
 *    the limb and as the globe shrinks into the distance. The base ripples fade
 *    by `uWaveFadeStrength`, which is 0 at the shipped baseline, so the default
 *    look is untouched; the finer detail layer below always fades at full
 *    strength, because it only appears well above the baseline.
 *  - **The detail layer.** The *same* ripple map is sampled again at a different
 *    scale and scrolled a different way (its offset is advanced in `Ocean.tsx`),
 *    so the surface evolves and morphs instead of sliding as one rigid sheet.
 *    The two tangent-space normals are blended by adding them and re-normalising
 *    — the standard scrolling-normal-map technique.
 *
 * The whole block is skipped while both weights are zero (the baseline), so no
 * extra work or texture fetch is done and the shipped look is preserved exactly.
 *
 * `normalMap` and `tbn` are declared by the standard material itself whenever it
 * has a tangent-space normal map, which the water always does.
 */
export const WATER_FRAGMENT_WAVE_NORMAL = /* glsl */ `
#ifdef USE_NORMALMAP_TANGENTSPACE
if (uWaveFadeStrength > 0.002 || uWaveBlend > 0.002) {
  float viewFade = waterRippleFade(waterGeoNormal);
  // Ease the base ripples back toward the smooth surface. At the baseline
  // uWaveFadeStrength is 0, so this is exactly the base normal.
  normal = normalize(mix(waterGeoNormal, normal, mix(1.0, viewFade, uWaveFadeStrength)));
  if (uWaveBlend > 0.002) {
    vec2 waveUv2 = vSeaUv * uWaveRepeat2 + uWaveOffset2;
    vec3 waveN2 = texture2D( normalMap, waveUv2 ).xyz * 2.0 - 1.0;
    waveN2.xy *= uWaveScale2;
    normal = normalize( normal + normalize( tbn * waveN2 ) * (uWaveBlend * viewFade) );
  }
}
#endif
`
