import type { ScaleMode, ScaleSettings } from '../types'

/**
 * "Educational Scale"
 *
 * True-to-scale astronomy is unusable in a single view: at real ratios Earth
 * would be a fraction of a pixel next to Jupiter, and Neptune's orbit would be
 * 600 times further out than Mercury's.
 *
 * Instead every radius and distance is passed through a power curve. An
 * exponent of 1 keeps the true proportion; smaller exponents squash the range
 * so that everything stays visible. `0` would make everything identical.
 */

export const SCALE_PRESETS: Record<
  Exclude<ScaleMode, 'custom'>,
  { sizeExponent: number; distanceExponent: number; label: string; blurb: string }
> = {
  educational: {
    sizeExponent: 0.45,
    distanceExponent: 0.62,
    label: 'Educational Scale',
    blurb:
      'Sizes and distances are gently squashed so every planet is visible at once. Great for learning the order of things.',
  },
  'relative-size': {
    sizeExponent: 1,
    distanceExponent: 0.3,
    label: 'Relative Size',
    blurb:
      'Planet sizes are truly proportional to each other — but the orbits are squashed together so you can still see them all.',
  },
  distances: {
    sizeExponent: 0.28,
    distanceExponent: 1,
    label: 'Distances Emphasised',
    blurb:
      'Orbits keep their true relative distances (so the Solar System looks mostly empty), while planet sizes are levelled up.',
  },
}

export const DEFAULT_SCALE: ScaleSettings = {
  mode: 'educational',
  sizeExponent: SCALE_PRESETS.educational.sizeExponent,
  distanceExponent: SCALE_PRESETS.educational.distanceExponent,
}

/**
 * World units per astronomical unit when the distance exponent is 1. Chosen so
 * that Neptune's orbit comfortably fills a 16:9 frame.
 */
const DISTANCE_UNIT_PER_AU = 18
/**
 * World units for a planet the size of Earth when the size exponent is 1.
 * Sized so even Mercury reads as a visible disc in the wide shot — at true
 * scale it would be a fraction of a single pixel.
 */
const SIZE_UNIT_PER_EARTH = 0.72
const EARTH_DIAMETER_KM = 12_742
const SUN_DIAMETER_KM = 1_392_700

/** Beyond this many AU the orbits simply end, so we clamp to keep it sane. */
const MAX_AU = 46

export function planetRadiusUnits(diameterKm: number, sizeExponent: number): number {
  const relative = diameterKm / EARTH_DIAMETER_KM
  return SIZE_UNIT_PER_EARTH * Math.pow(relative, sizeExponent)
}

/**
 * The Sun sits on its own curve: its true diameter is 109x Earth's, so even a
 * squashed curve would swamp the orbits. We use a gentler exponent and a cap so
 * it always reads as clearly the biggest thing in the scene.
 */
export function sunRadiusUnits(sizeExponent: number): number {
  const relative = SUN_DIAMETER_KM / EARTH_DIAMETER_KM
  const radius = SIZE_UNIT_PER_EARTH * 1.55 * Math.pow(relative, sizeExponent * 0.55)
  return clamp(radius, 1.5, 12)
}

export function orbitRadiusUnits(semiMajorAxisAU: number, distanceExponent: number): number {
  const au = Math.min(semiMajorAxisAU, MAX_AU)
  return DISTANCE_UNIT_PER_AU * Math.pow(au, distanceExponent)
}

export function semiMinorRatio(eccentricity: number): number {
  return Math.sqrt(Math.max(1e-6, 1 - eccentricity * eccentricity))
}

/** Mean orbital speed in km/s — used for the velocity arrows in the orbit lesson. */
export function orbitalSpeedKmS(semiMajorAxisAU: number, periodDays: number): number {
  const circumferenceKm = 2 * Math.PI * semiMajorAxisAU * 149_597_870.7
  const seconds = periodDays * 86_400
  return circumferenceKm / seconds
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** Largest orbit radius in the current scale, used to frame the wide shot. */
export function systemRadiusUnits(distanceExponent: number): number {
  return orbitRadiusUnits(MAX_AU, distanceExponent)
}

/** Compresses real diameters so Earth reads as roughly 1 world unit. */
export function lessonRadius(diameterKm: number, earthDiameterKm = EARTH_DIAMETER_KM): number {
  return Math.pow(diameterKm / earthDiameterKm, 0.6)
}

/**
 * Moon radii are compressed hard against their parent. At true scale the Moon
 * would be 27% of Earth's width, which reads as a speck; Ganymede really is a
 * third of Jupiter's size, which reads as a second planet. The curve keeps the
 * ordering obvious while stopping the big moons from competing with planets.
 */
export function moonRadiusUnits(
  diameterKm: number,
  parentDiameterKm: number,
  parentRadius: number,
): number {
  const ratio = diameterKm / parentDiameterKm
  return parentRadius * clamp(ratio ** 0.45 * 0.42, 0.05, 0.3)
}