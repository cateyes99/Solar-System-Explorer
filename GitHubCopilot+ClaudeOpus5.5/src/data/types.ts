export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export type BodyId = 'sun' | PlanetId | 'moon'

export type BodyKind = 'star' | 'planet' | 'moon'

/** Simplified circular-orbit elements (approximate J2000 values). */
export interface OrbitalElements {
  semiMajorAxisAU: number
  meanLongitudeJ2000Deg: number
  inclinationDeg: number
  ascendingNodeDeg: number
}

/** Real astronomical data, rounded. Presentation lives in visuals.ts. */
export interface CelestialBody {
  id: BodyId
  name: string
  kind: BodyKind
  type: string
  diameterKm: number
  distanceFromSunKm: number
  parentId?: BodyId
  distanceFromParentKm?: number
  orbitalPeriodDays: number
  orbitNote?: string
  rotationPeriodHours: number
  dayNote?: string
  moons: number
  moonsNote?: string
  temperatureC: number
  temperatureNote?: string
  surfaceGravity: number
  axialTiltDeg: number
  color: string
  tagline: string
  description: string
  facts: string[]
  didYouKnow: string
  orbit?: OrbitalElements
}
