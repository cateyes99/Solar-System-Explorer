import { MathUtils, Vector3 } from 'three'
import type { PlanetData } from '../types'
import { getOrbitalAngle } from './simulationClock'

export function getOrbitalPosition(body: PlanetData, radius: number, target = new Vector3()): Vector3 {
  const angle = getOrbitalAngle(body.orbitalPeriodDays, body.phase)
  const inclination = MathUtils.degToRad(body.inclinationDeg)
  const flatZ = Math.sin(angle) * radius
  return target.set(
    Math.cos(angle) * radius,
    flatZ * Math.sin(inclination),
    flatZ * Math.cos(inclination),
  )
}

export function formatTemperature(celsius: number): string {
  if (celsius > 1000) return `${celsius.toLocaleString()}°C on average`
  return `About ${celsius}°C on average`
}

export function lightMinutes(kilometres: number): number {
  return kilometres / 299_792.458 / 60
}
