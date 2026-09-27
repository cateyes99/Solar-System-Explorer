import ephemeris from '../data/halley-ephemeris.json'
import { Body, MassProduct } from 'astronomy-engine'
import { EllipseCurve, Vector3 } from 'three'
import { kepler3 } from 'astronomia/kepler'

export const halleySamples = ephemeris.samples
export const halleyStart = halleySamples[0][0]
export const halleyEnd = halleySamples[halleySamples.length - 1][0]
const boundaryOrbits = [halleySamples[0], halleySamples[halleySamples.length - 1]].map(sample => ({
  date: sample[0],
  ...orbitFromState(new Vector3(...sample.slice(1, 4)), new Vector3(...sample.slice(4, 7))),
}))

export function halleyVectorAt(julianDate: number): [number, number, number] {
  if (!Number.isFinite(julianDate)) throw new RangeError('Halley requires a finite Julian date.')
  if (julianDate < halleyStart || julianDate > halleyEnd) {
    const orbit = boundaryOrbits[julianDate < halleyStart ? 0 : 1]
    const period = 2 * Math.PI / orbit.meanMotion
    const meanAnomaly = orbit.meanAnomaly + orbit.meanMotion * ((julianDate - orbit.date) % period)
    const eccentricAnomaly = kepler3(orbit.eccentricity, meanAnomaly)
    return orbit.majorAxis.clone().multiplyScalar(orbit.semiMajor * (Math.cos(eccentricAnomaly) - orbit.eccentricity))
      .addScaledVector(orbit.minorAxis, orbit.semiMinor * Math.sin(eccentricAnomaly)).toArray() as [number, number, number]
  }
  let lower = 0
  let upper = halleySamples.length - 1
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2)
    if (halleySamples[middle][0] <= julianDate) lower = middle
    else upper = middle
  }
  const first = halleySamples[lower]
  const second = halleySamples[upper]
  const interval = second[0] - first[0]
  const fraction = (julianDate - first[0]) / interval
  const squared = fraction * fraction
  const cubed = squared * fraction
  return [1, 2, 3].map(axis =>
    (2 * cubed - 3 * squared + 1) * first[axis]
    + (cubed - 2 * squared + fraction) * interval * first[axis + 3]
    + (-2 * cubed + 3 * squared) * second[axis]
    + (cubed - squared) * interval * second[axis + 3],
  ) as [number, number, number]
}

function orbitFromState(position: Vector3, velocity: Vector3) {
  const gravity = MassProduct(Body.Sun)
  const momentum = new Vector3().crossVectors(position, velocity)
  const eccentricityVector = new Vector3().crossVectors(velocity, momentum).divideScalar(gravity).sub(position.clone().normalize())
  const eccentricity = eccentricityVector.length()
  const semiMajor = 1 / (2 / position.length() - velocity.lengthSq() / gravity)
  const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity)
  const majorAxis = eccentricityVector.normalize()
  const minorAxis = new Vector3().crossVectors(momentum.normalize(), majorAxis).normalize()
  const eccentricAnomaly = Math.atan2(position.dot(minorAxis) / semiMinor, position.dot(majorAxis) / semiMajor + eccentricity)
  return { eccentricity, semiMajor, semiMinor, majorAxis, minorAxis, meanAnomaly: eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly), meanMotion: Math.sqrt(gravity / semiMajor ** 3) }
}

export function halleyOrbitAt(julianDate: number): [number, number, number][] {
  if (!Number.isFinite(julianDate)) throw new RangeError('Halley requires a finite Julian date.')
  const before = Math.max(halleyStart, Math.min(halleyEnd - .02, julianDate - .01))
  const after = Math.min(halleyEnd, before + .02)
  const orbit = julianDate <= halleyStart ? boundaryOrbits[0] : julianDate >= halleyEnd ? boundaryOrbits[1]
    : orbitFromState(new Vector3(...halleyVectorAt(julianDate)), new Vector3(...halleyVectorAt(after)).sub(new Vector3(...halleyVectorAt(before))).divideScalar(after - before))
  const { eccentricity, semiMajor, semiMinor, majorAxis, minorAxis } = orbit
  const ellipse = new EllipseCurve(-semiMajor * eccentricity, 0, semiMajor, semiMinor, 0, Math.PI * 2, false, 0)
  const points = ellipse.getPoints(1024).map(point => majorAxis.clone().multiplyScalar(point.x).addScaledVector(minorAxis, point.y).toArray() as [number, number, number])
  points[points.length - 1] = [...points[0]]
  return points
}

export function cometActivity(distanceAU: number): number {
  return Math.max(0, Math.min(1, (3.5 - distanceAU) / 2.9)) ** 2
}