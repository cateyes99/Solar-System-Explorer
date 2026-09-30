/**
 * "Educational Scale" system.
 *
 * Real physics makes planets invisible dots, so instead we ship four deliberate,
 * designed scale modes. Every dimension in the scene flows through this file.
 */

export type ScaleMode = 'educational' | 'relativeSize' | 'distances' | 'custom'

export interface CustomScale {
  /** 0.4 – 3.0 multiplier applied to planet radii */
  sizeScale: number
  /** 0.4 – 1.2 exponent applied to orbital distance (lower = more compressed) */
  distancePower: number
}

export interface ScaleConfig {
  mode: ScaleMode
  /** Orbital radius in world units for a body at `au` AU from the Sun */
  orbitRadius: (au: number) => number
  /** Visual radius in world units for a body of `diameterKm` km */
  planetRadius: (diameterKm: number) => number
  /** Radius of the Sun in world units */
  sunRadius: number
  /** Moon orbit radius around Earth, in world units */
  moonOrbit: number
  /** Explanatory copy shown in the UI */
  note: string
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Base educational orbit mapping: compressed so Neptune stays on screen. */
function educationalOrbit(au: number): number {
  return 6 + 46 * Math.pow(au, 0.56)
}

/** Base educational planet sizing: exaggerated small worlds, compressed giants. */
function educationalRadius(diameterKm: number): number {
  return 1.1 * Math.pow(diameterKm / 12_756, 0.4)
}

export const SCALE_NOTES: Record<ScaleMode, string> = {
  educational:
    'Educational Scale — sizes and distances are adjusted so everything is easy to see. Not to scale.',
  relativeSize:
    'Relative Size — planets are shown at their true size compared with each other. Distances are still adjusted. Not to scale.',
  distances:
    'Distances Emphasized — the gaps between orbits are stretched out so you can feel how far apart the planets really are.',
  custom:
    'Custom — you are in control of planet size and orbital spacing. This is a simplified educational model.',
}

export function getScaleConfig(mode: ScaleMode, custom: CustomScale): ScaleConfig {
  switch (mode) {
    case 'relativeSize':
      return {
        mode,
        orbitRadius: educationalOrbit,
        // True relative sizes: Earth = 1.0 world unit
        planetRadius: (diameterKm) => clamp(diameterKm / 12_756, 0.18, 40),
        // The Sun would swallow the whole scene at true scale, so it is reduced.
        sunRadius: 7.5,
        moonOrbit: 4.2,
        note: SCALE_NOTES.relativeSize,
      }
    case 'distances':
      return {
        mode,
        orbitRadius: (au) => 5 + 26 * Math.pow(au, 0.95),
        planetRadius: (diameterKm) => educationalRadius(diameterKm) * 0.72,
        sunRadius: educationalRadius(1_392_700) * 0.72 * 0.62,
        moonOrbit: 2.6,
        note: SCALE_NOTES.distances,
      }
    case 'custom':
      return {
        mode,
        orbitRadius: (au) => 6 + 46 * Math.pow(au, clamp(custom.distancePower, 0.4, 1.2)),
        planetRadius: (diameterKm) =>
          educationalRadius(diameterKm) * clamp(custom.sizeScale, 0.4, 3),
        sunRadius: educationalRadius(1_392_700) * clamp(custom.sizeScale, 0.4, 3) * 0.62,
        moonOrbit: 3.4 * clamp(custom.sizeScale, 0.4, 3),
        note: SCALE_NOTES.custom,
      }
    case 'educational':
    default:
      return {
        mode: 'educational',
        orbitRadius: educationalOrbit,
        planetRadius: educationalRadius,
        sunRadius: educationalRadius(1_392_700) * 0.62,
        moonOrbit: 3.4,
        note: SCALE_NOTES.educational,
      }
  }
}

export const DEFAULT_CUSTOM_SCALE: CustomScale = { sizeScale: 1, distancePower: 0.56 }

/** Aspect ratio the home framing was designed for (desktop landscape). */
export const HOME_REFERENCE_ASPECT = 1.6

/**
 * Pulls the home camera back on narrow / portrait viewports so Neptune's orbit
 * still fits on screen. Returns 1 on wide screens.
 */
export function homeDistanceScale(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return 1
  return Math.min(2.4, Math.max(1, HOME_REFERENCE_ASPECT / aspect))
}

/** A sensible home camera framing for the whole system (fits Neptune's orbit). */
export const HOME_CAMERA = {
  position: [0, 240, 450] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
}

/** AU grid used to invert the (non-linear) orbit mapping. */
const AU_GRID = [0, 0.1, 0.387, 0.723, 1, 1.524, 2.1, 2.7, 3.3, 5.2, 9.54, 19.19, 30.07, 60]

/**
 * Inverse of `orbitRadius`: converts a distance in world units back into AU
 * (piecewise linear over a fixed grid) so the spacecraft HUD can report a
 * meaningful "distance from the Sun".
 */
export function auFromWorldRadius(
  radius: number,
  orbitRadius: (au: number) => number,
): number {
  for (let i = 1; i < AU_GRID.length; i++) {
    const a = AU_GRID[i - 1]
    const b = AU_GRID[i]
    const ra = orbitRadius(a)
    const rb = orbitRadius(b)
    if (radius <= rb || i === AU_GRID.length - 1) {
      const t = rb === ra ? 0 : (radius - ra) / (rb - ra)
      return a + Math.max(0, Math.min(1, t)) * (b - a)
    }
  }
  return AU_GRID[AU_GRID.length - 1]
}
