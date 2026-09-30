import { Vector3 } from 'three'
import type { Planet, ScaleSettings } from '../../types'
import { orbitRadiusUnits, semiMinorRatio } from '../../utils/scale'
import { degToRad } from '../../utils/math'

export interface OrbitGeometry {
  /** Semi-major axis in world units. */
  a: number
  /** Semi-minor axis in world units. */
  b: number
  eccentricity: number
  /** Inclination to the reference plane, radians. */
  inclination: number
  /** Longitude of the ascending node, radians — spreads the orbits in 3D. */
  node: number
}

const NODE_SPREAD = 37

export function planetOrbit(planet: Planet, scale: ScaleSettings, index: number): OrbitGeometry {
  const a = orbitRadiusUnits(planet.semiMajorAxisAU, scale.distanceExponent)
  return {
    a,
    b: a * semiMinorRatio(planet.eccentricity),
    eccentricity: planet.eccentricity,
    inclination: degToRad(planet.inclinationDeg),
    node: degToRad(index * NODE_SPREAD),
  }
}

/** Eccentric anomaly in radians from the simulation clock. */
export function orbitAngle(simDays: number, planet: Planet): number {
  const turns = simDays / planet.orbitalPeriodDays + planet.orbitPhase / (Math.PI * 2)
  return (turns * Math.PI * 2) % (Math.PI * 2)
}

/** Writes the local-space position for an orbit into `target`. */
export function orbitPosition(orbit: OrbitGeometry, angle: number, target: Vector3): Vector3 {
  return target.set(
    orbit.a * (Math.cos(angle) - orbit.eccentricity),
    0,
    orbit.b * Math.sin(angle),
  )
}

/** Sample points around the full ellipse for drawing the orbit path. */
export function orbitPoints(orbit: OrbitGeometry, segments = 192): Vector3[] {
  const points: Vector3[] = []
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    points.push(orbitPosition(orbit, angle, new Vector3()))
  }
  return points
}

/** Instantaneous velocity direction, used by the orbit lesson's arrows. */
export function orbitVelocityDirection(orbit: OrbitGeometry, angle: number): Vector3 {
  return new Vector3(-orbit.a * Math.sin(angle), 0, orbit.b * Math.cos(angle)).normalize()
}