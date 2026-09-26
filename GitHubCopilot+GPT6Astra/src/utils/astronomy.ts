import { Body, Ecliptic, HelioVector, GeoMoon } from 'astronomy-engine'
import { bodyById, DAY_MS, EPOCH, type BodyId } from '../data/planets'

export type ScaleMode = 'educational' | 'relative' | 'distances' | 'custom'
export type Point3 = [number, number, number]

export function radiusFor(id: BodyId, scale: ScaleMode, size = 1): number {
  const body = bodyById[id]
  if (scale === 'relative') return body.diameter / bodyById.jupiter.diameter * 2.25
  return body.radius * (scale === 'custom' && id !== 'sun' ? size : 1)
}

export function orbitFor(id: BodyId, scale: ScaleMode, spacing = 1): number {
  const body = bodyById[id]
  if (id === 'moon') return 2.1
  if (scale === 'distances') return body.distanceAU * 2.4 + (id === 'sun' ? 0 : 6)
  if (scale === 'relative' && id !== 'sun') return radiusFor('sun', 'relative') * 1.2 + body.orbit * 2
  return body.orbit * (scale === 'custom' ? spacing : 1)
}

export function positionFor(id: BodyId, days: number, scale: ScaleMode, spacing = 1, size = 1): Point3 {
  if (id === 'sun') return [0, 0, 0]
  const date = new Date(EPOCH + days * DAY_MS)
  const vector = Ecliptic(id === 'moon' ? GeoMoon(date) : HelioVector(bodyById[id].name as Body, date))
  const angle = vector.elon * Math.PI / 180
  if (id === 'moon') {
    const earth = positionFor('earth', days, scale, spacing, size)
    const radius = Math.max(radiusFor('earth', scale, size) * 2.3, radiusFor('moon', scale, size) * 5)
    return [earth[0] + Math.cos(angle) * radius, earth[1] + Math.sin(vector.elat * Math.PI / 180) * radius, earth[2] - Math.sin(angle) * radius]
  }
  const radius = orbitFor(id, scale, spacing)
  return [Math.cos(angle) * radius, Math.sin(vector.elat * Math.PI / 180) * radius * .35, -Math.sin(angle) * radius]
}

export function formatDate(days: number): string {
  return new Date(EPOCH + days * DAY_MS).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function clampDays(days: number): number {
  return Math.max(-25000, Math.min(25000, days))
}

export function gravityAcceleration(mass: number, distance: number): number {
  return mass / (distance * distance)
}