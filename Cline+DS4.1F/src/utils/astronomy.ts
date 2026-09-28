import type { CelestialBody } from '../types'

/** Astronomical unit in kilometres (IAU 2012 definition). */
export const AU_KM = 149_597_870.7

/** J2000.0 epoch: 1 January 2000, 12:00 UTC. */
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)

export const DEG = Math.PI / 180

/**
 * Whole days (including fractions) since J2000.0 — the time base for the mean
 * orbital elements in `data/planets.ts`.
 */
export function daysSinceJ2000(timeMs: number): number {
  return (timeMs - J2000_MS) / 86_400_000
}

export interface OrbitalState {
  /** Distance from the Sun in kilometres. */
  distanceKm: number
  /** Heliocentric longitude in radians, measured in the ecliptic plane. */
  angleRad: number
}

/**
 * Solves Kepler's equation `E - e·sin E = M` for the eccentric anomaly.
 *
 * Newton–Raphson is safe here: the left-hand side increases strictly with E for
 * every e < 1, so the iteration always converges. For the eccentricities in
 * `data/planets.ts` (the highest is the comet's 0.72) five or six steps reach
 * full double precision.
 */
function eccentricAnomaly(meanAnomaly: number, e: number): number {
  let eccentric = meanAnomaly
  for (let i = 0; i < 6; i += 1) {
    const residual = eccentric - e * Math.sin(eccentric) - meanAnomaly
    const slope = 1 - e * Math.cos(eccentric)
    const step = residual / slope
    eccentric -= step
    if (Math.abs(step) < 1e-12) break
  }
  return eccentric
}

/** Wraps an angle into `[0, 2π)`. */
function reduceAngle(angle: number): number {
  const wrapped = angle % (Math.PI * 2)
  return wrapped < 0 ? wrapped + Math.PI * 2 : wrapped
}

/**
 * Position of a body on its orbit.
 *
 * The mean anomaly marches steadily with time; Kepler's equation then turns it
 * into the eccentric anomaly, from which the radius and the true anomaly follow
 * exactly. Solving it (rather than approximating it with a truncated equation of
 * the centre, which is only valid for near-circular orbits) guarantees what the
 * eye expects: a body always travels the same way round its orbit, hurrying
 * through perihelion and dawdling near aphelion. The approximation breaks down
 * badly on the comet — at e = 0.72 it reverses direction twice per orbit.
 *
 * The angle stays on the same polar ellipse the orbit line is drawn from,
 * `r(θ) = a(1 - e²) / (1 + e·cos(θ - ϖ))`, so the body never leaves its path.
 */
export function orbitalState(body: CelestialBody, days: number): OrbitalState {
  const a = body.semiMajorAxisKm
  const e = body.orbitalEccentricity
  if (a <= 0 || body.orbitalPeriodDays <= 0) {
    return { distanceKm: 0, angleRad: 0 }
  }

  const meanLongitude = body.meanLongitudeJ2000Deg + (360 / body.orbitalPeriodDays) * days
  // Kept inside one revolution: the longitude grows without bound as the
  // simulation runs, and trigonometry stays most accurate near zero.
  const meanAnomaly = reduceAngle((meanLongitude - body.longitudeOfPeriapsisDeg) * DEG)

  const eccentric = eccentricAnomaly(meanAnomaly, e)
  const distanceKm = a * (1 - e * Math.cos(eccentric))
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(eccentric / 2),
    Math.sqrt(1 - e) * Math.cos(eccentric / 2),
  )
  return { distanceKm, angleRad: trueAnomaly + body.longitudeOfPeriapsisDeg * DEG }
}

/** Samples the orbital ellipse so we can draw the real (slightly stretched) path. */
export function orbitSamples(body: CelestialBody, samples = 256): Float64Array {
  const e = body.orbitalEccentricity
  const a = body.semiMajorAxisKm
  const out = new Float64Array(samples * 2)
  for (let i = 0; i < samples; i += 1) {
    const t = (i / samples) * Math.PI * 2
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(t))
    const angle = t + body.longitudeOfPeriapsisDeg * DEG
    out[i * 2] = r * Math.cos(angle)
    out[i * 2 + 1] = r * Math.sin(angle)
  }
  return out
}

/**
 * Converts a heliocentric distance and angle into scene coordinates.
 * `-sin` puts the counter-clockwise motion of the planets on the +Y-up axis,
 * exactly as it looks when you look down on the ecliptic from the north.
 */
export function toSceneXZ(distance: number, angleRad: number): { x: number; z: number } {
  return { x: Math.cos(angleRad) * distance, z: -Math.sin(angleRad) * distance }
}

/** Rotation angle (radians) of a body's surface after `days` of simulation. */
export function rotationAngle(body: CelestialBody, days: number): number {
  if (body.rotationPeriodHours === 0) return 0
  const rotations = (days * 24) / body.rotationPeriodHours
  return rotations * Math.PI * 2
}

/** Phase of the Moon as seen from Earth: 0 = new, 0.5 = full, 1 = new again. */
export function moonPhase(moonDays: number, periodDays: number): number {
  const phase = (moonDays % periodDays) / periodDays
  return phase < 0 ? phase + 1 : phase
}

export const MOON_PHASE_NAMES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const

/** Maps a 0…1 phase to one of the eight classic names. */
export function moonPhaseName(phase: number): string {
  const index = Math.round(phase * 8) % 8
  return MOON_PHASE_NAMES[index]
}

/** Light travel time from the Sun to a distance, in minutes. */
export function lightMinutes(distanceKm: number): number {
  return distanceKm / 299_792.458 / 60
}