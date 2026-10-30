/**
 * The ocean's wave animation, and how the "Wave intensity" slider maps onto it.
 *
 * The volumetric ocean draws a genuinely dynamic sea: a **procedural height
 * field** evaluated from the sphere's own direction and advected through time
 * (see `components/3d/water.ts`), not a tiling normal map slid across the
 * surface. One panel slider — **Wave intensity**, 0…100% — scales the whole
 * effect through four related properties:
 *
 *  - **Amplitude** (`amplitude`): how far the waves tilt the surface normal, so
 *    how choppy the sea reads. It is a *lighting* strength, not real geometry:
 *    the water is a smooth sphere and the waves live in its normals.
 *  - **Flow speed** (`speed`): how fast the whole field is advected through time,
 *    so the swells travel and the chop churns faster or slower.
 *  - **Variability** (`variability`): the weight of the domain-warped fine chop
 *    against the long swells — the irregular, ever-changing detail that keeps the
 *    surface from reading as a few clean sine waves.
 *  - **Coastal interaction** (`coastal`): how strong the animated surf is where
 *    the water meets the shore.
 *
 * The curves are deliberately **not linear**. Amplitude and speed rise steeply
 * from zero (so the default already reads as a living sea, not a faint one) and
 * then flatten toward the top (so the maximum stays coherent instead of turning
 * into noise). Variability and coastal stay at zero through the low half, so a
 * gentle sea is smooth and only a strong one breaks on the coast.
 *
 * At 0% the surface is completely still: a flat normal and a frozen field — no
 * motion, no chop, no surf. This module is deliberately free of runtime imports
 * so it can be unit-tested directly under Node (see `tests/waves.test.ts`).
 */

/** The slider's default position, 0…1. */
export const WAVE_INTENSITY_DEFAULT = 0.25

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
 * Turns the panel's 0…1 intensity into the four animation properties. Values
 * outside 0…1 are clamped, so an out-of-range config can never exaggerate the
 * effect.
 */
export function waveParams(intensity: number): WaveParams {
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
