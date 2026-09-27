import { AstroTime, Body, HelioVector, GeoMoon, MakeTime, RotateVector, RotationAxis, Rotation_EQJ_ECL, Vector } from 'astronomy-engine'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { bodyById, DAY_MS, EPOCH, type BodyId } from '../data/planets'
import { halleyEnd, halleyOrbitAt, halleyStart, halleyVectorAt } from './halley'

export type ScaleMode = 'educational' | 'relative' | 'distances' | 'custom'
export type Point3 = [number, number, number]
export const MIN_DAYS = (AstroTime.FromTerrestrialTime(halleyStart - 2451545).date.getTime() + 1 - EPOCH) / DAY_MS
export const MAX_DAYS = (AstroTime.FromTerrestrialTime(halleyEnd - 2451545).date.getTime() - 1 - EPOCH) / DAY_MS

export function usesApproximatePositions(days: number): boolean {
  return days < MIN_DAYS || days > MAX_DAYS
}

const eclipticRotation = Rotation_EQJ_ECL()
const moonMeanDistanceAU = 384400 / 149597870.7

export function radiusFor(id: BodyId, scale: ScaleMode, size = 1): number {
  const body = bodyById[id]
  if (scale === 'relative') return body.diameter / bodyById.jupiter.diameter * 2.25
  return body.radius * (scale === 'custom' && id !== 'sun' ? size : 1)
}

export function orbitFor(id: BodyId, scale: ScaleMode, spacing = 1, size = 1): number {
  const body = bodyById[id]
  if (id === 'halley') return halleyScale(scale, spacing, size) * body.distanceAU
  if (id === 'moon') return 2.1
  if (scale === 'distances') return body.distanceAU * 2.4 + (id === 'sun' ? 0 : 6)
  if (scale === 'relative' && id !== 'sun') return radiusFor('sun', 'relative') * 1.2 + body.orbit * 2
  if (scale === 'custom' && id !== 'sun') return Math.max(body.orbit * spacing, (radiusFor('sun', scale) + radiusFor(id, scale, size) + .1) / .79)
  return body.orbit
}

export function positionFor(id: BodyId, days: number, scale: ScaleMode, spacing = 1, size = 1): Point3 {
  if (id === 'sun') return [0, 0, 0]
  const date = new Date(EPOCH + days * DAY_MS)
  if (id === 'halley') return halleyScenePoint(halleyVectorAt(MakeTime(date).tt + 2451545), scale, spacing, size)
  const vector = RotateVector(eclipticRotation, id === 'moon' ? GeoMoon(date) : HelioVector(bodyById[id].name as Body, date))
  if (id === 'moon') {
    const earth = positionFor('earth', days, scale, spacing, size)
    const factor = Math.max(radiusFor('earth', scale, size) * 2.3, radiusFor('moon', scale, size) * 5) / moonMeanDistanceAU
    return [earth[0] + vector.x * factor, earth[1] + vector.z * factor, earth[2] - vector.y * factor]
  }
  const factor = orbitFor(id, scale, spacing, size) / bodyById[id].distanceAU
  return [vector.x * factor, vector.z * factor, -vector.y * factor]
}

export function orbitPathFor(id: Exclude<BodyId, 'sun' | 'moon'>, days: number, scale: ScaleMode, spacing = 1, size = 1): Point3[] {
  const period = bodyById[id].year
  if (id === 'halley') {
    const date = MakeTime(new Date(EPOCH + days * DAY_MS)).tt + 2451545
    return halleyOrbitAt(date).map(point => halleyScenePoint(point, scale, spacing, size))
  }
  return Array.from({ length: 513 }, (_, index) => positionFor(id, days + (index / 512 - .5) * period, scale, spacing, size))
}

function halleyScale(scale: ScaleMode, spacing: number, size: number): number {
  return Math.max(orbitFor('earth', scale, spacing, size), (radiusFor('sun', scale) + radiusFor('halley', scale, size) + .5) / .57)
}

function halleyScenePoint(point: Point3, scale: ScaleMode, spacing: number, size: number): Point3 {
  const factor = halleyScale(scale, spacing, size)
  return [point[0] * factor, point[2] * factor, -point[1] * factor]
}

export function formatDate(days: number): string {
  return new Date(EPOCH + days * DAY_MS).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function plutoOrientation(days: number): Quaternion {
  const date = new Date(EPOCH + days * DAY_MS)
  const axis = RotationAxis(Body.Pluto, date)
  const rightAscension = axis.ra * Math.PI / 12
  const node = RotateVector(eclipticRotation, new Vector(-Math.sin(rightAscension), Math.cos(rightAscension), 0, MakeTime(date)))
  const pole = RotateVector(eclipticRotation, axis.north)
  const north = new Vector3(pole.x, pole.z, -pole.y)
  const prime = new Vector3(node.x, node.z, -node.y).applyAxisAngle(north, (axis.spin % 360) * Math.PI / 180)
  const east = new Vector3().crossVectors(prime, north).normalize()
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(prime, north, east))
}

export function clampDays(days: number): number {
  return Math.max(MIN_DAYS, Math.min(MAX_DAYS, days))
}

export function gravityAcceleration(mass: number, distance: number): number {
  return mass / (distance * distance)
}