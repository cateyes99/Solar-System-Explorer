/**
 * Seafloor visibility and depth maths.
 *
 * The "Seawater opacity" slider is a **nominal** visibility control, not a model
 * of underwater light transport. At slider value S (0…100):
 *
 *     O = S / 100        normalised ocean opacity
 *     V = 1 − O          nominal seafloor visibility factor
 *
 * 100% (O = 1) leaves the ocean exactly as it was; 0% (V = 1) drains it. The
 * shader multiplies the seafloor's displacement and its colour contribution by
 * V. The *perceived* visibility of the floor also depends on the seafloor colour
 * ramp, the vertical exaggeration, the depth, the sun angle, the cloud and haze
 * layers and the camera distance — all of which the panel's hint text mentions.
 * None of this is a claim about real optical clarity.
 *
 * This module is deliberately free of runtime imports so it can be unit-tested
 * directly under Node (see `tests/seawater.test.ts`).
 */

/** Earth's mean radius in metres — the denominator of every depth fraction. */
export const EARTH_RADIUS_M = 6_371_000

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/** Turns the panel's 0…1 opacity into the 0…1 seafloor visibility factor. */
export function seawaterVisibility(opacity: number): number {
  return 1 - clamp01(opacity)
}

/**
 * Inverts the depth field's curve encoding: a stored texel (0…255) back to a
 * 0…1 depth fraction (0 = sea level, 1 = the deepest point).
 *
 *     depthFraction = (texel / 255) ^ exponent
 *
 * `tools/fetch-bathymetry.mjs` writes the map with `exponent = 2`, a square-root
 * curve, so the shallow continental shelves keep most of the 8-bit levels.
 */
export function depthFraction(texelByte: number, exponent: number): number {
  return Math.pow(clamp01(texelByte / 255), exponent)
}

/** The depth a stored texel stands for, in metres. */
export function depthMeters(texelByte: number, maxDepthMeters: number, exponent: number): number {
  return depthFraction(texelByte, exponent) * maxDepthMeters
}

/**
 * The deepest point's displacement, as a fraction of the planet's radius, for a
 * given vertical exaggeration. `maxExaggeration × relief` is the stretch; the
 * true ocean is only ~0.17% of Earth's radius deep, so a large stretch is what
 * makes the floor visible at all (and is disclosed in the UI).
 */
export function seafloorDepthRadius(
  maxDepthMeters: number,
  maxExaggeration: number,
  relief: number,
): number {
  return (maxDepthMeters / EARTH_RADIUS_M) * maxExaggeration * Math.max(0, relief)
}
