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

/** A point in 3D, used for ecliptic-frame (km) and scene coordinates alike. */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * Solves Kepler's equation `E - e·sin E = M` for the eccentric anomaly.
 *
 * Newton–Raphson is safe here: the left-hand side increases strictly with E for
 * every e < 1, so the iteration always converges. For the eccentricities in
 * `data/planets.ts` (the highest is Halley's 0.967) five or six steps reach full
 * double precision.
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
 * The classical Keplerian elements of an orbit.
 *
 * Everything is expressed in a right-handed ecliptic frame at J2000.0: x toward
 * the vernal equinox, y in the ecliptic 90° ahead of x, z toward the north
 * ecliptic pole. A point on the orbit is the perifocal position rotated by
 * Rz(Ω)·Rx(i)·Rz(ω), where
 *
 *  - `ascending`   is the longitude of the ascending node, Ω;
 *  - `argPeriapsis` is the argument of periapsis, ω;
 *  - `i`           is the inclination to the ecliptic.
 *
 * `CelestialBody` stores the longitude of perihelion (ϖ = Ω + ω) and the mean
 * longitude (L = ϖ + M₀) instead, so this derives ω and M₀ from those.
 *
 * When the body carries JPL/Standish secular rates, the elements are advanced
 * from J2000 to the requested date first. That is what keeps the real shape,
 * tilt and orientation of every orbit for centuries: without it the elements
 * would be frozen at the year 2000 and the drawn path would slowly part company
 * with the true one. The mean anomaly is *not* advanced here — it already marches
 * at the sidereal rate implied by `orbitalPeriodDays`, which equals the published
 * L̇ − ϖ̇ to the precision of the data.
 */
interface Elements {
  a: number
  e: number
  i: number
  ascending: number
  argPeriapsis: number
  meanAnomaly0: number
}

/** Julian centuries since J2000.0 (36,525 days). */
const DAYS_PER_CENTURY = 36_525

function elementsOf(body: CelestialBody, days: number): Elements {
  const centuries = days / DAYS_PER_CENTURY
  const periapsisDeg =
    body.longitudeOfPeriapsisDeg + (body.longitudeOfPeriapsisRateDegPerCentury ?? 0) * centuries
  const ascendingDeg =
    body.longitudeOfAscendingNodeDeg + (body.ascendingNodeRateDegPerCentury ?? 0) * centuries
  return {
    a: body.semiMajorAxisKm + (body.semiMajorAxisRateKmPerCentury ?? 0) * centuries,
    e: body.orbitalEccentricity + (body.eccentricityRatePerCentury ?? 0) * centuries,
    i: (body.orbitalInclinationDeg + (body.inclinationRateDegPerCentury ?? 0) * centuries) * DEG,
    ascending: ascendingDeg * DEG,
    argPeriapsis: (periapsisDeg - ascendingDeg) * DEG,
    meanAnomaly0: (body.meanLongitudeJ2000Deg - body.longitudeOfPeriapsisDeg) * DEG,
  }
}

/**
 * Position for a given eccentric anomaly, in the same ecliptic frame.
 *
 * In the orbital plane the point is `(a(cos E − e), a√(1−e²)·sin E)`; the two
 * basis vectors below are the axes of that plane inside the ecliptic, so the
 * result is the exact two-body position with the real inclination and node.
 */
function positionFromEccentric(elements: Elements, eccentric: number): Vec3 {
  const { a, e, i, ascending, argPeriapsis } = elements
  const xOrb = a * (Math.cos(eccentric) - e)
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(eccentric)

  const cosO = Math.cos(ascending)
  const sinO = Math.sin(ascending)
  const cosW = Math.cos(argPeriapsis)
  const sinW = Math.sin(argPeriapsis)
  const cosI = Math.cos(i)
  const sinI = Math.sin(i)

  // P points at periapsis, Q lies 90° ahead of it, both measured in the ecliptic.
  const px = cosO * cosW - sinO * sinW * cosI
  const py = sinO * cosW + cosO * sinW * cosI
  const pz = sinW * sinI
  const qx = -cosO * sinW - sinO * cosW * cosI
  const qy = -sinO * sinW + cosO * cosW * cosI
  const qz = cosW * sinI

  return {
    x: xOrb * px + yOrb * qx,
    y: xOrb * py + yOrb * qy,
    z: xOrb * pz + yOrb * qz,
  }
}

/**
 * Heliocentric position of a body, in kilometres, in the ecliptic J2000 frame.
 *
 * The mean anomaly marches steadily with time; Kepler's equation turns it into
 * the eccentric anomaly, and the measured inclination and node then lift the body
 * off the ecliptic. That is what makes Mercury and Pluto weave above and below
 * the other planets, and sends Halley round the Sun the wrong way.
 */
export function orbitalPositionKm(body: CelestialBody, days: number): Vec3 {
  const elements = elementsOf(body, days)
  if (elements.a <= 0 || body.orbitalPeriodDays <= 0) return { x: 0, y: 0, z: 0 }
  const meanAnomaly = reduceAngle(elements.meanAnomaly0 + (Math.PI * 2 * days) / body.orbitalPeriodDays)
  const eccentric = eccentricAnomaly(meanAnomaly, elements.e)
  return positionFromEccentric(elements, eccentric)
}

/**
 * Samples the whole orbit (km, ecliptic frame) so the real path can be drawn.
 *
 * `days` is the date the path is drawn for: the secular rates are applied there,
 * so the ellipse on screen is the one the body is actually travelling along at
 * the simulated date rather than the J2000 one.
 */
export function orbitPathKm(body: CelestialBody, samples = 256, days = 0): Float64Array {
  const elements = elementsOf(body, days)
  const out = new Float64Array(samples * 3)
  for (let k = 0; k < samples; k += 1) {
    const point = positionFromEccentric(elements, (k / samples) * Math.PI * 2)
    out[k * 3] = point.x
    out[k * 3 + 1] = point.y
    out[k * 3 + 2] = point.z
  }
  return out
}

/**
 * Permutes an ecliptic-frame position into scene coordinates.
 *
 * The scene lays the ecliptic flat on the XZ plane with +Y up, so the ecliptic's
 * z (north) becomes the scene's y and the ecliptic's y becomes the scene's −z.
 * That − sign is what turns the planets' counter-clockwise motion the right way
 * round when you look down on the ecliptic from the north.
 */
export function toSceneAxis(position: Vec3): Vec3 {
  return { x: position.x, y: position.z, z: -position.y }
}

/**
 * The orbital elements a moon needs, with the semi-major axis already in scene
 * units (moon orbits are compressed to fit beside their planet, so no radial
 * mapping is needed afterwards).
 */
export interface SatelliteOrbit {
  semiMajor: number
  eccentricity: number
  inclinationDeg: number
  ascendingNodeDeg: number
  argumentOfPeriapsisDeg: number
  meanAnomaly0Deg: number
  periodDays: number
}

function satelliteElements(orbit: SatelliteOrbit): Elements {
  return {
    a: orbit.semiMajor,
    e: orbit.eccentricity,
    i: orbit.inclinationDeg * DEG,
    ascending: orbit.ascendingNodeDeg * DEG,
    argPeriapsis: orbit.argumentOfPeriapsisDeg * DEG,
    meanAnomaly0: orbit.meanAnomaly0Deg * DEG,
  }
}

/** Position of a moon around its parent, in scene coordinates. */
export function satellitePosition(orbit: SatelliteOrbit, days: number): Vec3 {
  const elements = satelliteElements(orbit)
  if (elements.a <= 0 || orbit.periodDays <= 0) return { x: 0, y: 0, z: 0 }
  const meanAnomaly = reduceAngle(elements.meanAnomaly0 + (Math.PI * 2 * days) / orbit.periodDays)
  const eccentric = eccentricAnomaly(meanAnomaly, elements.e)
  return toSceneAxis(positionFromEccentric(elements, eccentric))
}

/** Samples a moon's orbit (scene coordinates) so its path can be drawn. */
export function satelliteOrbitPath(orbit: SatelliteOrbit, samples = 128): Float64Array {
  const elements = satelliteElements(orbit)
  const out = new Float64Array(samples * 3)
  for (let k = 0; k < samples; k += 1) {
    const point = toSceneAxis(positionFromEccentric(elements, (k / samples) * Math.PI * 2))
    out[k * 3] = point.x
    out[k * 3 + 1] = point.y
    out[k * 3 + 2] = point.z
  }
  return out
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
