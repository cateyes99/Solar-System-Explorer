/**
 * Orbital geometry for the orrery.
 *
 * Directions are real. Each planet's position comes from the published JPL
 * Keplerian elements, so the inclination, the orientation of the orbit plane,
 * the longitude of perihelion and the position along the orbit are all honest.
 *
 * Radii are still compressed, because true scale is unusable in one view — but
 * only the radius is scaled. Compressing a direction would destroy the very
 * thing this module exists to get right, so the sunward vector keeps its
 * direction and only its length is passed through the scale curve.
 */

import { Vector3 } from 'three'
import type { Planet, ScaleSettings } from '../../types'
import { orbitRadiusUnits } from '../../utils/scale'
import {
  centuriesPastJ2000,
  eclipticToScene,
  heliocentricEcliptic,
  propagate,
  type PropagatedElements,
} from '../../utils/ephemeris'

export interface OrbitGeometry {
  /** Planet id, so the position can be re-derived from the live clock. */
  id: string
  /** Semi-major axis in world units, for framing the camera. */
  a: number
  /** Semi-minor axis in world units. */
  b: number
  eccentricity: number
  /** True inclination to the ecliptic, radians. */
  inclination: number
  /** True longitude of the ascending node, radians. */
  node: number
}

/**
 * Static per-planet geometry: the scale-dependent parts. Positions are computed
 * per frame from the clock, so this only holds what does not change.
 */
export function planetOrbit(planet: Planet, scale: ScaleSettings): OrbitGeometry {
  const a = orbitRadiusUnits(planet.semiMajorAxisAU, scale.distanceExponent)
  return {
    id: planet.id,
    a,
    b: a * Math.sqrt(Math.max(1e-6, 1 - planet.eccentricity * planet.eccentricity)),
    eccentricity: planet.eccentricity,
    inclination: (planet.inclinationDeg * Math.PI) / 180,
    node: 0,
  }
}

/**
 * A planet's position at a given simulated time, in world units.
 *
 * The direction is the real heliocentric direction rotated into the scene
 * frame; only the distance is compressed by the scale curve, so the orbit keeps
 * its true shape in angle while remaining visible.
 */
export function orbitPositionAt(
  orbit: OrbitGeometry,
  simulatedMs: number,
  distanceExponent: number,
  target: Vector3,
): Vector3 {
  const t = centuriesPastJ2000(simulatedMs)
  const ecliptic = heliocentricEcliptic(orbit.id, t, _ecliptic)
  if (!ecliptic) return target.set(0, 0, 0)
  eclipticToScene(ecliptic, _scene)
  // Scale the length only: the direction carries the real orbital geometry.
  const trueDistanceAu = _scene.length()
  if (trueDistanceAu < 1e-9) return target.set(0, 0, 0)
  const scaled = orbitRadiusUnits(trueDistanceAu, distanceExponent)
  return target.copy(_scene).multiplyScalar(scaled / trueDistanceAu)
}

const _ecliptic = new Vector3()
const _scene = new Vector3()

/**
 * Sample the full orbit path for the ring.
 *
 * Sampling is uniform in eccentric anomaly, not in time. That traces the ellipse
 * exactly once regardless of how long the orbit takes, which matters because a
 * time-based sample would need 165 simulated years to close Neptune's orbit and
 * would draw only an arc. Ellipse *shape* comes from the elements either way;
 * the planet's varying speed along it comes from the live position, not here.
 */
export function orbitPath(
  orbit: OrbitGeometry,
  simulatedMs: number,
  distanceExponent: number,
  segments = 220,
): Vector3[] {
  const t = centuriesPastJ2000(simulatedMs)
  const el = propagate(orbit.id, t)
  if (!el) return []

  const points: Vector3[] = []
  for (let i = 0; i < segments; i += 1) {
    const eccentric = (i / segments) * Math.PI * 2
    const xv = el.a * (Math.cos(eccentric) - el.e)
    const yv = el.a * Math.sqrt(Math.max(0, 1 - el.e * el.e)) * Math.sin(eccentric)
    orbitalPlaneToScene(el, xv, yv, _scene)
    const au = _scene.length()
    if (au < 1e-9) continue
    const scaled = orbitRadiusUnits(au, distanceExponent)
    points.push(new Vector3().copy(_scene).multiplyScalar(scaled / au))
  }
  return points
}

/** Rotates in-plane orbital coordinates into the scene frame. */
function orbitalPlaneToScene(
  el: PropagatedElements,
  xv: number,
  yv: number,
  target: Vector3,
): Vector3 {
  const cw = Math.cos(el.argPeri)
  const sw = Math.sin(el.argPeri)
  const cO = Math.cos(el.node)
  const sO = Math.sin(el.node)
  const cI = Math.cos(el.i)
  const sI = Math.sin(el.i)
  const x = (cw * cO - sw * sO * cI) * xv + (-sw * cO - cw * sO * cI) * yv
  const y = (cw * sO + sw * cO * cI) * xv + (-sw * sO + cw * cO * cI) * yv
  const z = sw * sI * xv + cw * sI * yv
  return eclipticToScene(_ecliptic.set(x, y, z), target)
}

/**
 * Instantaneous direction of travel, for the velocity arrows in the orbit
 * lesson. Derived from the real velocity rather than the orbit's tangent.
 */
export function orbitVelocityDirection(
  orbit: OrbitGeometry,
  simulatedMs: number,
  target: Vector3,
): Vector3 {
  const t = centuriesPastJ2000(simulatedMs)
  const now = heliocentricEcliptic(orbit.id, t, _ecliptic)
  const soon = heliocentricEcliptic(orbit.id, t + 0.0002, _vEcliptic)
  if (!now || !soon) return target.set(1, 0, 0)
  eclipticToScene(now, _scene)
  eclipticToScene(soon, _vScene)
  return target.copy(_vScene).sub(_scene).normalize()
}

const _vEcliptic = new Vector3()
const _vScene = new Vector3()
