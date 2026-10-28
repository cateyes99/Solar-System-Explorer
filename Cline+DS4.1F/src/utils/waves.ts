/**
 * The ocean's wave animation, and how the "Wave intensity" slider maps onto it.
 *
 * The volumetric ocean draws a rippled water surface (see `components/3d/
 * Ocean.tsx` and `water.ts`). One panel slider — **Wave intensity**, 0…100% —
 * scales the whole effect through four related properties:
 *
 *  - **Amplitude** (`normalScale`): how far the ripples tilt the surface normal,
 *    so how choppy the water reads. A *lighting* strength, not real geometry:
 *    the water is a smooth sphere and the waves are painted into its normals.
 *  - **Flow speed** (`driftScale`): how fast the ripple pattern scrolls.
 *  - **Variability** (`variability`): the weight of a second, finer ripple layer
 *    that scrolls at a different scale and direction, so the surface evolves
 *    instead of sliding rigidly (and the tiling stops showing).
 *  - **Coastal interaction** (`coastal`): how strong the animated surf is where
 *    the water meets the shore.
 *
 * The curves are deliberately **not linear**. They are anchored at three points
 * so the slider is predictable and the shipped look is preserved:
 *
 *     intensity   0.00      0.25 (baseline)      1.00 (maximum)
 *     amplitude   0         0.45                 1.05
 *     speed       0×        1×                   2.5×
 *     variability 0         0                    1
 *     coastal     0         0                    1
 *
 * 25% reproduces the ocean **exactly as it shipped** (that is what `0.25` is
 * anchored to), and it is also the default, so the ocean opens looking the way it
 * always has. At 0% the surface is completely still: a flat normal, no scrolling,
 * no second layer, no surf.
 *
 * Amplitude and speed are single power curves through their anchor points. The
 * amplitude curve is *saturating* (its exponent is below 1): pushing the normal
 * strength up linearly would make a small tiled map sparkle — the classic
 * specular-aliasing "disco ball" — so the top of the range is compressed and the
 * second layer carries the extra motion instead. Variability and coastal stay at
 * zero through the lower half so the baseline is untouched.
 *
 * This module is deliberately free of runtime imports so it can be unit-tested
 * directly under Node (see `tests/waves.test.ts`).
 */

/** The slider value that reproduces the ocean exactly as it shipped. */
export const WAVE_INTENSITY_BASELINE = 0.25
/** The slider's default position: the shipped look, i.e. the baseline itself. */
export const WAVE_INTENSITY_DEFAULT = WAVE_INTENSITY_BASELINE
/** The ripple amplitude (`normalScale`) at the baseline. */
export const WAVE_BASELINE_NORMAL_SCALE = 0.45
/** The tuned ripple amplitude at 100%. */
export const WAVE_MAX_NORMAL_SCALE = 1.05
/** The tuned flow-speed multiplier at 100%. */
export const WAVE_MAX_SPEED_SCALE = 2.5

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

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/** GLSL's `smoothstep`: 0 below `edge0`, 1 above `edge1`, smooth between. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** The four animation properties the wave slider drives. */
export interface WaveParams {
  /** The surface's ripple amplitude, handed to the material's `normalScale`. */
  normalScale: number
  /** A multiplier on the surface's base drift, so 1 is the shipped speed. */
  driftScale: number
  /** The second ripple layer's blend weight, 0…1. */
  variability: number
  /** The coastal surf strength, 0…1. */
  coastal: number
}

/**
 * Turns the panel's 0…1 intensity into the four animation properties. Values
 * outside 0…1 are clamped, so an out-of-range config can never exaggerate the
 * effect.
 */
export function waveParams(intensity: number): WaveParams {
  const w = clamp01(intensity)
  if (w <= 0) {
    return { normalScale: 0, driftScale: 0, variability: 0, coastal: 0 }
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
  }
}
