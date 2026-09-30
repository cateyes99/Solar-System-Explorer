import type { Body, OrbitalElements } from '../data/planets'

/** Julian-date style day count since J2000 (2000-01-01T12:00:00Z). */
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)

export function daysSinceJ2000(ms: number): number {
  return (ms - J2000_MS) / 86_400_000
}

export function j2000ToMs(days: number): number {
  return J2000_MS + days * 86_400_000
}

const DEG = Math.PI / 180

/**
 * Solve Kepler's equation with a few Newton iterations — plenty of accuracy
 * for an educational visualization and cheap enough to run every frame.
 */
function solveKepler(meanAnomaly: number, eccentricity: number): number {
  let eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(meanAnomaly)
  for (let i = 0; i < 4; i++) {
    const f = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly
    const fp = 1 - eccentricity * Math.cos(eccentricAnomaly)
    eccentricAnomaly -= f / fp
  }
  return eccentricAnomaly
}

export interface BodyState {
  /** Position in orbital plane units where 1 = the body's semi-major axis (AU) scaled later */
  x: number
  z: number
  /** Distance from the Sun in AU */
  distanceAu: number
  /** Angle in radians measured from +X towards +Z (counter-clockwise, prograde) */
  angle: number
}

/**
 * Compute the ecliptic position of a body at a given day offset from J2000.
 * Simplified: real orbital elements, Kepler solved, inclination applied.
 * Output is in AU (x, z) with y ≈ 0 for the visual model (inclination folded in).
 */
export function orbitalPosition(el: OrbitalElements, days: number): BodyState {
  if (el.semiMajorAxisAu === 0) {
    return { x: 0, z: 0, distanceAu: 0, angle: 0 }
  }
  const a = el.semiMajorAxisAu
  const e = el.eccentricity
  const meanMotion = (2 * Math.PI) / (365.25 * Math.sqrt(a ** 3)) // rad/day (Kepler III)
  const meanAnomaly =
    ((el.meanLongitudeDeg - el.longitudePerihelionDeg) * DEG + meanMotion * days) %
    (2 * Math.PI)
  const eccentricAnomaly = solveKepler(meanAnomaly, e)

  // Position in the orbital plane
  const xp = a * (Math.cos(eccentricAnomaly) - e)
  const zp = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly)

  // Rotate by longitude of perihelion
  const w = el.longitudePerihelionDeg * DEG
  const x1 = xp * Math.cos(w) - zp * Math.sin(w)
  const z1 = xp * Math.sin(w) + zp * Math.cos(w)

  // Fold inclination into a small vertical offset (kept flat for readability)
  const i = el.inclinationDeg * DEG
  const y = z1 * Math.sin(i)
  const z = z1 * Math.cos(i)
  void y // vertical offset intentionally not used — the ecliptic stays flat

  const distanceAu = Math.sqrt(x1 * x1 + z * z)
  return { x: x1, z, distanceAu, angle: Math.atan2(z, x1) }
}

/** Rotation of a body about its own axis, in radians, at a given day offset. */
export function axialRotation(body: Body, days: number): number {
  if (body.rotationPeriodHours === 0) return 0
  const rotations = days * 24 / body.rotationPeriodHours
  return rotations * 2 * Math.PI
}

/** Simulated calendar date for display. */
export function formatSimDate(days: number): string {
  const d = new Date(j2000ToMs(days))
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatSimDateTime(days: number): string {
  const d = new Date(j2000ToMs(days))
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Friendly formatting of huge distances, e.g. 149_600_000 km → "149.6 million km" */
export function formatDistance(km: number): string {
  if (km >= 1_000_000_000) return `${(km / 1_000_000_000).toFixed(2)} billion km`
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)} million km`
  if (km >= 1_000) return `${(km / 1_000).toFixed(1)} thousand km`
  return `${Math.round(km)} km`
}

/** Format an orbital period in Earth days as something a child understands. */
export function formatYear(days: number): string {
  if (days < 100) return `${days.toFixed(0)} Earth days`
  const years = days / 365.25
  if (years < 1) return `${days.toFixed(0)} Earth days (~${Math.round(days / 30)} months)`
  if (years < 100) return `${years.toFixed(1)} Earth years`
  return `${Math.round(years)} Earth years`
}

export function formatDay(hours: number): string {
  const abs = Math.abs(hours)
  const retro = hours < 0 ? ' (backwards)' : ''
  if (abs < 48) {
    const h = abs.toFixed(1)
    return `${h} hours${retro}`
  }
  const earthDays = abs / 24
  if (earthDays > 100) return `${(earthDays / 24).toFixed(1)} Earth days${retro}`
  return `${earthDays.toFixed(1)} Earth days${retro}`
}
