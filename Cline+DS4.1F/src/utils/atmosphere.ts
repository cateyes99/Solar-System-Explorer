import { clamp } from './random'

/**
 * The strongest the haze may get, as a multiple of the shader's base intensity, at
 * 100% on the slider.
 *
 * The atmosphere is a thin additive rim: even at full shader strength its alpha
 * only reaches about a third at the very limb, and it is blended additively over a
 * bright planet. A plain 0…1 multiplier therefore has almost no visible travel —
 * 0% and 100% render nearly identically. Mapping the slider onto a wider range
 * gives it real room to move: 0% removes the air completely, and 100% is a full,
 * clearly glowing limb. (Verified by pixel-diffing the rendered frames.)
 */
export const ATMOSPHERE_MAX_OPACITY = 7

/**
 * Turns the Earth panel's 0…1 “Atmosphere haze” slider into the atmosphere
 * shader's opacity multiplier.
 *
 * The mapping is linear, so the change is proportional to the slider: half-way is
 * half the glow. `0 → 0` (no atmosphere at all) and `1 → ATMOSPHERE_MAX_OPACITY`
 * (full strength), with every value in between scaling smoothly.
 */
export function atmosphereOpacityFromSlider(value: number): number {
  return clamp(value, 0, 1) * ATMOSPHERE_MAX_OPACITY
}
