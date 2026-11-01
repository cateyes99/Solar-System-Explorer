/**
 * The ocean's wave animation, and how the "Wave intensity" slider maps onto it.
 *
 * The volumetric ocean can draw either of two wave models, chosen by the
 * panel's wave-style switcher (see `data/waveStyles.ts`), and this module maps
 * the one shared slider — **Wave intensity**, 0…100% — onto each of them:
 *
 *  - **Spectral** (`spectralWaveParams`): the living, procedural sea. A
 *    directional spectrum of plane waves evaluated from the sphere's own
 *    direction and advected through time (see `components/3d/water.ts`), not a
 *    tiling normal map slid across the surface. The slider scales four related
 *    properties:
 *      - **Amplitude** (`amplitude`): how far the waves tilt the surface normal,
 *        so how choppy the sea reads. It is a *lighting* strength, not real
 *        geometry: the water is a smooth sphere and the waves live in its
 *        normals.
 *      - **Flow speed** (`speed`): how fast the whole field is advected through
 *        time, so the swells travel and the chop churns faster or slower.
 *      - **Variability** (`variability`): the weight of the domain-warped fine
 *        chop against the long swells — the irregular, ever-changing detail that
 *        keeps the surface from reading as a few clean sine waves.
 *      - **Coastal interaction** (`coastal`): how strong the animated surf is
 *        where the water meets the shore.
 *  - **Ripples** (`rippleParams`): the original tiling ripple normal map, slid
 *    across the surface. The slider scales the ripple amplitude (`normalScale`),
 *    the scroll speed (`driftScale`), a second, finer detail layer
 *    (`variability`), the coastal surf (`coastal`) and the view/distance fade
 *    (`fadeStrength`).
 *
 * The curves are deliberately **not linear**, and each model is anchored so its
 * own default is faithful. The spectral curves rise steeply from zero (so the
 * default already reads as a living sea, not a faint one) and then flatten
 * toward the top (so the maximum stays coherent instead of turning into noise).
 * The ripple curves are anchored at three points so 25% — the default —
 * reproduces the tiled ocean exactly as it shipped:
 *
 *     intensity   0.00      0.25 (baseline)      1.00 (maximum)
 *     normalScale 0         0.45                 1.05
 *     driftScale  0×        1×                   2.5×
 *     variability 0         0                    1
 *     coastal     0         0                    1
 *     fadeStrength 0        0                    1
 *
 * The ripple amplitude curve is *saturating* (its exponent is below 1): pushing
 * the normal strength up linearly would make a small tiled map sparkle — the
 * classic specular-aliasing "disco ball" — so the top of the range is compressed
 * and the second layer carries the extra motion instead. Its variability,
 * coastal and fade stay at zero through the baseline so the shipped look is
 * untouched.
 *
 * At 0% either model is completely still: a flat normal and no motion, no chop
 * and no surf. This module is deliberately free of runtime imports so it can be
 * unit-tested directly under Node (see `tests/waves.test.ts`).
 */

/** The slider's default position, 0…1. */
export const WAVE_INTENSITY_DEFAULT = 0.25

/** The slider value that reproduces the tiled ocean exactly as it shipped. */
export const WAVE_INTENSITY_BASELINE = 0.25
/** The ripple amplitude (`normalScale`) at the baseline. */
export const WAVE_BASELINE_NORMAL_SCALE = 0.45
/** The tuned ripple amplitude at 100%. */
export const WAVE_MAX_NORMAL_SCALE = 1.05
/** The tuned flow-speed multiplier at 100%. */
export const WAVE_MAX_SPEED_SCALE = 2.5

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/** GLSL's `smoothstep`: 0 below `edge0`, 1 above `edge1`, smooth between. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** The four animation properties the spectral wave slider drives. */
export interface WaveParams {
  /** Normal-tilt strength, 0…1, scaled by the field's `maxStrength`. */
  amplitude: number
  /** Time multiplier for the field's advection, 0…1. */
  speed: number
  /** The fine chop's weight against the swells, 0…1. */
  variability: number
  /** The coastal surf strength, 0…1. */
  coastal: number
}

/**
 * Turns the panel's 0…1 intensity into the spectral field's four animation
 * properties. Values outside 0…1 are clamped, so an out-of-range config can
 * never exaggerate the effect.
 */
export function spectralWaveParams(intensity: number): WaveParams {
  const w = clamp01(intensity)
  if (w <= 0) {
    return { amplitude: 0, speed: 0, variability: 0, coastal: 0 }
  }
  return {
    // Steep off the mark, flattening toward the top: the default is already a
    // convincing sea, and the maximum stays coherent rather than turning noisy.
    amplitude: Math.pow(w, 0.45),
    speed: Math.pow(w, 0.45),
    // The chop is nearly dormant in the gentlest seas and grows in over the
    // lower half, so even a calm sea has some life in it.
    variability: smoothstep(0.03, 0.6, w),
    // Only a strong sea breaks on the coast.
    coastal: smoothstep(0.45, 1, w),
  }
}

/** The animation properties the tiled-ripple wave slider drives. */
export interface RippleParams {
  /** The surface's ripple amplitude, handed to the material's `normalScale`. */
  normalScale: number
  /** A multiplier on the surface's base drift, so 1 is the shipped speed. */
  driftScale: number
  /** The second ripple layer's blend weight, 0…1. */
  variability: number
  /** The coastal surf strength, 0…1. */
  coastal: number
  /**
   * How strongly the view/distance fade is applied to the **base** ripple layer,
   * 0…1. It is 0 at and below the baseline, so the shipped look is untouched,
   * and rises to 1 at full intensity. The second layer and the surf — which are
   * dormant at the baseline — always use the full fade (see `Ocean.tsx`).
   */
  fadeStrength: number
}

/**
 * The amplitude curve's exponent, solved so the curve passes through both the
 * baseline `(0.25, 0.45)` and the maximum `(1.00, 1.05)`. Below 1, so the curve
 * flattens off toward the top.
 */
const AMPLITUDE_EXPONENT =
  Math.log(WAVE_MAX_NORMAL_SCALE / WAVE_BASELINE_NORMAL_SCALE) /
  Math.log(1 / WAVE_INTENSITY_BASELINE)
/** The speed curve's exponent, solved for `(0.25, 1×)` and `(1.00, 2.5×)`. */
const SPEED_EXPONENT = Math.log(WAVE_MAX_SPEED_SCALE) / Math.log(1 / WAVE_INTENSITY_BASELINE)

/**
 * Turns the panel's 0…1 intensity into the tiled ripples' animation properties.
 * Values outside 0…1 are clamped, so an out-of-range config can never exaggerate
 * the effect.
 */
export function rippleParams(intensity: number): RippleParams {
  const w = clamp01(intensity)
  if (w <= 0) {
    return { normalScale: 0, driftScale: 0, variability: 0, coastal: 0, fadeStrength: 0 }
  }
  // Both power curves are written against the baseline, so the ratio is exactly
  // 1 — and the values exactly the shipped ones — at `w = 0.25`.
  const ratio = w / WAVE_INTENSITY_BASELINE
  return {
    normalScale: WAVE_BASELINE_NORMAL_SCALE * Math.pow(ratio, AMPLITUDE_EXPONENT),
    driftScale: Math.pow(ratio, SPEED_EXPONENT),
    // Both stay at zero through the baseline, so 25% is untouched, and ramp in
    // only over the upper part of the slider.
    variability: smoothstep(0.35, 1, w),
    coastal: smoothstep(0.4, 1, w),
    // The base layer only starts to fade once the slider is above the shipped
    // baseline, so 25% is pixel-identical to the ocean as it always looked.
    fadeStrength: clamp01((w - WAVE_INTENSITY_BASELINE) / (1 - WAVE_INTENSITY_BASELINE)),
  }
}
