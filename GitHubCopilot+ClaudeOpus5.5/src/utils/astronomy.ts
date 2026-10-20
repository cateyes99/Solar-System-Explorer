import type { CelestialBody } from '../data/types'

export const J2000_MS = Date.UTC(2000, 0, 1, 12)
export const MS_PER_DAY = 86_400_000
export const SYNODIC_MONTH_DAYS = 29.530589
export const SPEED_OF_LIGHT_KM_S = 299_792.458
/** Days from J2000 to a known new moon (2000-01-06 18:14 UTC). */
const NEW_MOON_REFERENCE_DAYS = 5.2597
const MOON_INCLINATION_RAD = (5.14 * Math.PI) / 180

export const DEG = Math.PI / 180
export const TAU = Math.PI * 2

export interface Vec3Like {
  x: number
  y: number
  z: number
}

export function dateToDays(date: Date): number {
  return (date.getTime() - J2000_MS) / MS_PER_DAY
}

export function daysToDate(days: number): Date {
  return new Date(J2000_MS + days * MS_PER_DAY)
}

/** Mean longitude (radians) on a simplified circular orbit. */
export function meanLongitude(body: CelestialBody, days: number): number {
  const orbit = body.orbit
  if (!orbit) return 0
  return (orbit.meanLongitudeJ2000Deg + (360 * days) / body.orbitalPeriodDays) * DEG
}

/**
 * Position on an inclined circular orbit. Ecliptic coordinates are mapped to
 * the scene with +Y as ecliptic north, so orbits run counter-clockwise when
 * seen from above.
 */
export function orbitPoint(
  longitude: number,
  radius: number,
  inclinationDeg: number,
  ascendingNodeDeg: number,
  out: Vec3Like,
): Vec3Like {
  const node = ascendingNodeDeg * DEG
  const inc = inclinationDeg * DEG
  const u = longitude - node
  const cosU = Math.cos(u)
  const sinU = Math.sin(u)
  const cosN = Math.cos(node)
  const sinN = Math.sin(node)
  const cosI = Math.cos(inc)
  const xEcl = radius * (cosN * cosU - sinN * sinU * cosI)
  const yEcl = radius * (sinN * cosU + cosN * sinU * cosI)
  const zEcl = radius * sinU * Math.sin(inc)
  out.x = xEcl
  out.y = zEcl
  out.z = -yEcl
  return out
}

/** 0 = new moon, 0.5 = full moon. */
export function moonPhase(days: number): number {
  const p = (days - NEW_MOON_REFERENCE_DAYS) / SYNODIC_MONTH_DAYS
  return p - Math.floor(p)
}

/** Direction of the Moon around Earth, consistent with the real phase. */
export function moonLongitude(earthLongitude: number, days: number): number {
  return earthLongitude + Math.PI + moonPhase(days) * TAU
}

export function moonOffset(longitude: number, radius: number, out: Vec3Like): Vec3Like {
  out.x = Math.cos(longitude) * radius
  out.y = Math.sin(longitude) * Math.sin(MOON_INCLINATION_RAD) * radius
  out.z = -Math.sin(longitude) * radius
  return out
}

export function phaseName(phase: number): string {
  const p = ((phase % 1) + 1) % 1
  if (p < 0.03 || p > 0.97) return 'New Moon'
  if (p < 0.22) return 'Waxing Crescent'
  if (p < 0.28) return 'First Quarter'
  if (p < 0.47) return 'Waxing Gibbous'
  if (p < 0.53) return 'Full Moon'
  if (p < 0.72) return 'Waning Gibbous'
  if (p < 0.78) return 'Last Quarter'
  return 'Waning Crescent'
}

export function lightTravelSeconds(distanceKm: number): number {
  return distanceKm / SPEED_OF_LIGHT_KM_S
}

/** Volume ratio of two spheres given diameters. */
export function volumeRatio(diameterA: number, diameterB: number): number {
  return (diameterA / diameterB) ** 3
}

export function solveKepler(meanAnomaly: number, eccentricity: number): number {
  let e = eccentricity < 0.8 ? meanAnomaly : Math.PI
  for (let i = 0; i < 8; i++) {
    e -= (e - eccentricity * Math.sin(e) - meanAnomaly) / (1 - eccentricity * Math.cos(e))
  }
  return e
}
