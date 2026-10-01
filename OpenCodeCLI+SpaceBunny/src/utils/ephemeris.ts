/**
 * Real orbital mechanics from the JPL approximate-elements solution.
 *
 * The orrery no longer guesses where a planet is. Given a date it propagates the
 * published Keplerian elements forward, solves Kepler's equation for the
 * eccentric anomaly, and rotates the resulting orbital-plane coordinates into
 * the ecliptic frame. That gives each planet its true position, its true orbital
 * plane orientation, and — because the mean anomaly advances linearly while the
 * eccentric anomaly does not — the real variation in orbital speed. Mercury
 * genuinely races near perihelion and crawls near aphelion now, as it does.
 */

import { Vector3 } from 'three'
import {
  DAYS_PER_JULIAN_CENTURY,
  JD_J2000,
  KEPLERIAN_ELEMENTS,
  OBLIQUITY_RAD,
  type KeplerianSet,
} from '../data/keplerian'

const DEG = Math.PI / 180

/** Elements at a given time, with the per-century rates applied. */
export interface PropagatedElements {
  /** Semi-major axis in au. */
  a: number
  e: number
  /** Inclination to the ecliptic, radians. */
  i: number
  /** Mean longitude, radians. */
  l: number
  /** Longitude of perihelion, radians. */
  peri: number
  /** Longitude of the ascending node, radians. */
  node: number
  /** Argument of perihelion, radians. */
  argPeri: number
}

export function propagate(id: string, centuriesPastJ2000: number): PropagatedElements | null {
  const base = KEPLERIAN_ELEMENTS[id]
  if (!base) return null
  return withRates(base, centuriesPastJ2000)
}

function withRates(set: KeplerianSet, t: number): PropagatedElements {
  const i = (set.i + set.iDot * t) * DEG
  const peri = (set.peri + set.periDot * t) * DEG
  const node = (set.node + set.nodeDot * t) * DEG
  return {
    a: set.a + set.aDot * t,
    e: set.e + set.eDot * t,
    i,
    l: (set.l + set.lDot * t) * DEG,
    peri,
    node,
    argPeri: peri - node,
  }
}

/**
 * Solves Kepler's equation M = E − e·sin E for the eccentric anomaly.
 *
 * Newton's method from the standard starting guess. Mercury's eccentricity is
 * 0.206, the highest in the Solar System, so this needs to converge properly
 * rather than be approximated away.
 */
export function solveKepler(meanAnomaly: number, e: number): number {
  const m = ((meanAnomaly + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
  let anomaly = m + e * Math.sin(m)
  for (let i = 0; i < 12; i += 1) {
    const delta = (anomaly - e * Math.sin(anomaly) - m) / (1 - e * Math.cos(anomaly))
    anomaly -= delta
    if (Math.abs(delta) < 1e-12) break
  }
  return anomaly
}

/**
 * Heliocentric position in the ecliptic frame, in astronomical units.
 * This is the JPL formulation exactly: orbital-plane coordinates first, then
 * rotate by the argument of perihelion, the inclination and the node.
 */
export function heliocentricEcliptic(id: string, centuriesPastJ2000: number, target: Vector3): Vector3 | null {
  const el = propagate(id, centuriesPastJ2000)
  if (!el) return null

  const eccentric = solveKepler(el.l - el.peri, el.e)
  const xv = el.a * (Math.cos(eccentric) - el.e)
  const yv = el.a * Math.sqrt(Math.max(0, 1 - el.e * el.e)) * Math.sin(eccentric)

  const cw = Math.cos(el.argPeri)
  const sw = Math.sin(el.argPeri)
  const cO = Math.cos(el.node)
  const sO = Math.sin(el.node)
  const cI = Math.cos(el.i)
  const sI = Math.sin(el.i)

  const x = (cw * cO - sw * sO * cI) * xv + (-sw * cO - cw * sO * cI) * yv
  const y = (cw * sO + sw * cO * cI) * xv + (-sw * sO + cw * cO * cI) * yv
  const z = sw * sI * xv + cw * sI * yv

  return target.set(x, y, z)
}

/** Unit vector normal to a planet's orbital plane, in ecliptic coordinates. */
export function orbitNormal(el: PropagatedElements, target: Vector3): Vector3 {
  return target
    .set(Math.sin(el.i) * Math.sin(el.node), -Math.sin(el.i) * Math.cos(el.node), Math.cos(el.i))
    .normalize()
}

/**
 * The scene is Y-up, but astronomy is Z-up with the ecliptic as the reference
 * plane. Rather than tilting the whole solar system, positions are rotated from
 * ecliptic coordinates into the scene frame: ecliptic X → scene X, ecliptic Y →
 * scene −Z, ecliptic Z (ecliptic north) → scene Y. This is a handedness-preserving
 * change of basis, so orbit directions and pole directions stay consistent.
 */
export function eclipticToScene(v: Vector3, target: Vector3): Vector3 {
  return target.set(v.x, v.z, -v.y)
}

/** Converts the app's simulated day count into Julian centuries past J2000. */
export function centuriesPastJ2000(simulatedMs: number): number {
  const julianDate = simulatedMs / 86_400_000 + 2440587.5
  return (julianDate - JD_J2000) / DAYS_PER_JULIAN_CENTURY
}

/**
 * Full rotation from the ecliptic frame to the equatorial frame, using the
 * obliquity of the ecliptic. IAU pole directions are quoted in equatorial
 * coordinates, so this is what lets a real pole be used in the scene.
 */
export function equatorialToScene(v: Vector3, target: Vector3): Vector3 {
  const c = Math.cos(OBLIQUITY_RAD)
  const s = Math.sin(OBLIQUITY_RAD)
  // equatorial -> ecliptic, then ecliptic -> scene.
  const xe = v.x
  const ye = v.y * c + v.z * s
  const ze = -v.y * s + v.z * c
  return target.set(xe, ze, -ye)
}
