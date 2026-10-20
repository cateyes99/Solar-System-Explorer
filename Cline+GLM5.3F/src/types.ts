/** Shared domain types. Scientific data lives in `src/data`, presentation in components. */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export type BodyId = 'sun' | 'moon' | PlanetId

export type BodyType = 'Star' | 'Terrestrial planet' | 'Gas giant' | 'Ice giant' | 'Moon'

export interface BodyInfo {
  id: BodyId
  name: string
  type: BodyType
  /** Equatorial diameter in kilometres. */
  diameterKm: number
  /** Mean distance from the Sun. `null` for the Moon (see distanceFromParentKm). */
  distanceFromSunKm: number | null
  distanceAU: number | null
  /** For the Moon: distance to its parent planet, in km. */
  distanceFromParentKm?: number
  orbitalPeriodDays: number
  /** Negative values mean retrograde rotation. */
  rotationPeriodHours: number
  axialTiltDeg: number
  /** Number of known natural satellites. `null` when not applicable. */
  moons: number | null
  /** Mean surface (or cloud-top) temperature in °C. */
  temperatureC: number
  color: string
  accentColor: string
  description: string
  facts: string[]
  didYouKnow: string
}

export interface PlanetData extends BodyInfo {
  id: PlanetId
  distanceFromSunKm: number
  distanceAU: number
  moons: number
  /** Inclination of the orbit relative to the ecliptic, degrees. */
  orbitalInclinationDeg: number
  /** Longitude of the ascending node, degrees — used to orient the inclined orbit. */
  ascendingNodeDeg: number
  /** Approximate mean longitude at the J2000 epoch, degrees. */
  phase0Deg: number
}

export interface SunData extends BodyInfo {
  id: 'sun'
}

export interface MoonData extends BodyInfo {
  id: 'moon'
}

export type ScaleMode = 'educational' | 'relative' | 'distances' | 'custom'

export interface CustomScale {
  /** Multiplier applied to body sizes in custom mode. */
  sizeExaggeration: number
  /** Multiplier applied to orbital distances in custom mode. */
  distanceSpread: number
}

export type WhatIfKey = 'twoMoons' | 'bigEarth' | 'noSun' | 'stoppedEarth'
