import ephemeris from '../data/halley-ephemeris.json'
import { Body, MassProduct } from 'astronomy-engine'
import { EllipseCurve, Vector3 } from 'three'

export const halleySamples = ephemeris.samples
export const halleyStart = halleySamples[0][0]
export const halleyEnd = halleySamples[halleySamples.length - 1][0]

export function halleyVectorAt(julianDate: number): [number, number, number] {
  if (!Number.isFinite(julianDate) || julianDate < halleyStart || julianDate > halleyEnd) throw new RangeError('Halley ephemeris covers 1957-2097 only.')
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

export function halleyOrbitAt(julianDate: number): [number, number, number][] {
  const position = new Vector3(...halleyVectorAt(julianDate))
  const before = Math.max(halleyStart, julianDate - .01)
  const after = Math.min(halleyEnd, julianDate + .01)
  const velocity = new Vector3(...halleyVectorAt(after)).sub(new Vector3(...halleyVectorAt(before))).divideScalar(after - before)
  const gravity = MassProduct(Body.Sun)
  const momentum = new Vector3().crossVectors(position, velocity)
  const eccentricityVector = new Vector3().crossVectors(velocity, momentum).divideScalar(gravity).sub(position.clone().normalize())
  const eccentricity = eccentricityVector.length()
  const semiMajor = 1 / (2 / position.length() - velocity.lengthSq() / gravity)
  const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity)
  const majorAxis = eccentricityVector.normalize()
  const minorAxis = new Vector3().crossVectors(momentum.normalize(), majorAxis).normalize()
  const ellipse = new EllipseCurve(-semiMajor * eccentricity, 0, semiMajor, semiMinor, 0, Math.PI * 2, false, 0)
  const points = ellipse.getPoints(1024).map(point => majorAxis.clone().multiplyScalar(point.x).addScaledVector(minorAxis, point.y).toArray() as [number, number, number])
  points[points.length - 1] = [...points[0]]
  return points
}

export function cometActivity(distanceAU: number): number {
  return Math.max(0, Math.min(1, (3.5 - distanceAU) / 2.9)) ** 2
}