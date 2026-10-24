/**
 * The spacecraft's size, as one of ten discrete levels.
 *
 * The model in `components/3d/spacecraft` is authored at its full size, which is
 * level 10. Every other level is that same model scaled uniformly: level `n` is
 * `n / 10` of the authored size, so level 4 — the default — is 40% of it, and
 * level 1 is a tenth. The level lives in `public/config.jsonc`; resizing the
 * ship never touches the model or the flight code.
 */

/** How many size levels the ship offers: 1 (smallest) … 10 (full size). */
export const SPACECRAFT_SIZE_LEVELS = 10

/** The smallest and largest configurable level. */
export const SPACECRAFT_SIZE_MIN = 1
export const SPACECRAFT_SIZE_MAX = SPACECRAFT_SIZE_LEVELS

/** The level used when the configuration does not name one (40% of full size). */
export const DEFAULT_SPACECRAFT_SIZE = 4

/** Rounds any value to a whole size level inside the valid range. */
export function clampSpacecraftSize(level: number): number {
  const whole = Number.isFinite(level) ? Math.round(level) : DEFAULT_SPACECRAFT_SIZE
  return Math.max(SPACECRAFT_SIZE_MIN, Math.min(SPACECRAFT_SIZE_MAX, whole))
}

/**
 * The uniform scale factor for a size level: level `n` is `n / 10` of the
 * model's authored size. The level is clamped first, so a stray value can never
 * shrink the ship to nothing or blow it up.
 */
export function spacecraftScaleForLevel(level: number): number {
  return clampSpacecraftSize(level) / SPACECRAFT_SIZE_LEVELS
}
