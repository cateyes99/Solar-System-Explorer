/**
 * Domain types for the Solar System Explorer.
 *
 * Scientific data lives in `src/data` and never imports from `components`/`store`.
 * Presentation-only hints (textures, glow, rings) live in `src/data/visuals.ts`.
 */

export type BodyId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'moon'
  | 'belt'
  | 'comet'
  | 'halley'

/** Every body that can be orbited, focused and followed. */
export type FocusTargetId = BodyId | 'spacecraft'

/**
 * `dwarf` is a world that is round and orbits the Sun but has not cleared its
 * lane — which is exactly why Pluto is no longer counted among the planets.
 */
export type BodyKind = 'star' | 'planet' | 'dwarf' | 'moon' | 'belt' | 'comet'

export interface CelestialBody {
  id: BodyId
  name: string
  kind: BodyKind
  /** Child-friendly classification, e.g. "Rocky world" or "Gas giant". */
  type: string
  diameterKm: number
  /** Mean distance from the Sun (0 for the Sun itself). */
  distanceFromSunKm: number
  /** Sidereal orbital period in Earth days (0 for the Sun). */
  orbitalPeriodDays: number
  /** Sidereal rotation period in hours; negative means retrograde spin. */
  rotationPeriodHours: number
  /** Semi-major axis in kilometres. */
  semiMajorAxisKm: number
  orbitalEccentricity: number
  /** Longitude of perihelion (degrees) at J2000. */
  longitudeOfPeriapsisDeg: number
  /** Mean longitude (degrees) at J2000. */
  meanLongitudeJ2000Deg: number
  /** Inclination of the orbit to the ecliptic (degrees, J2000). */
  orbitalInclinationDeg: number
  /** Longitude of the ascending node (degrees, J2000). */
  longitudeOfAscendingNodeDeg: number
  /**
   * Secular rates of change of the orbital elements, per Julian century, from
   * JPL's "Keplerian Elements for Approximate Positions of the Major Planets"
   * (E. M. Standish). When present, the elements are advanced from J2000 to the
   * simulated date, so the orbit keeps its real shape, tilt and orientation for
   * centuries instead of slowly drifting away from the true path.
   *
   * The mean longitude's own rate is not stored: the mean anomaly already
   * advances at the sidereal rate implied by `orbitalPeriodDays`, which equals
   * the published L̇ − ϖ̇ to the precision of the data.
   */
  semiMajorAxisRateKmPerCentury?: number
  eccentricityRatePerCentury?: number
  inclinationRateDegPerCentury?: number
  ascendingNodeRateDegPerCentury?: number
  longitudeOfPeriapsisRateDegPerCentury?: number
  axialTiltDeg: number
  /** Number of confirmed natural satellites (rounded, approximate). */
  moons: number
  /** Mean surface / cloud-top temperature in Celsius. */
  temperatureC: number
  massEarths: number
  /** Surface gravity in m/s². */
  surfaceGravity: number
  /** Representative colour used for UI accents. */
  color: string
  tagline: string
  description: string
  facts: string[]
  didYouKnow: string
  /**
   * Shown the first time a visitor clicks this body in the scene, when finding
   * it is meant to feel like a discovery (the comets). Most bodies have no
   * message of their own, so clicking them simply selects them.
   */
  discoveryToast?: string
  /** Set for natural satellites. */
  parentId?: BodyId
}

/** A small visual satellite rendered around a planet. */
export interface SatelliteDefinition {
  id: string
  name: string
  parentId: BodyId
  diameterKm: number
  orbitalRadiusKm: number
  orbitalPeriodDays: number
  color: string
  note: string
  /**
   * Inclination of the moon's orbit to the ecliptic (degrees). Most large moons
   * circle their planet's equator, so this is close to the planet's obliquity —
   * which is why Titan's orbit leans 27° and Titania's stands nearly upright.
   */
  orbitalInclinationDeg?: number
  /** Longitude of the ascending node (degrees); 0 when not measured here. */
  longitudeOfAscendingNodeDeg?: number
  /** Argument of periapsis (degrees). */
  argumentOfPeriapsisDeg?: number
  /** Orbital eccentricity — small, but real: our Moon's is 0.055. */
  orbitalEccentricity?: number
  /** Mean anomaly at J2000.0 (degrees): where the moon sits on its orbit. */
  meanAnomalyJ2000Deg?: number
}

export type ScaleMode = 'educational' | 'relativeSize' | 'distances' | 'custom'

export type QualityLevel = 'low' | 'medium' | 'high'

export interface CustomScale {
  /** 0.2 = strongly compressed sizes, 1 = true relative sizes. */
  sizeExponent: number
  /** 0.5 = tight orbits, 3 = very spread out orbits. */
  orbitSpread: number
  /** Visual radius of the Sun in scene units. */
  sunRadius: number
}

export type CameraMode = 'system' | 'planet' | 'follow' | 'cinematic'

export interface CameraRequest {
  id: number
  targetId: FocusTargetId | null
  mode: CameraMode
  distanceScale: number
}

export interface TimeSpeedOption {
  id: string
  label: string
  daysPerSecond: number
  shortLabel: string
}

export interface AstronomyFact {
  id: string
  text: string
  category: 'planets' | 'stars' | 'moons' | 'space' | 'history'
}

export type LessonId =
  | 'sun'
  | 'sizes'
  | 'distances'
  | 'gravity'
  | 'day-night'
  | 'seasons'
  | 'moon-phases'
  | 'orbits'

export interface Lesson {
  id: LessonId
  title: string
  emoji: string
  summary: string
  steps: LessonStep[]
  /** Actions offered to the child at the end of the lesson. */
  sceneAction?: LessonSceneAction
}

export interface LessonStep {
  text: string
  /** Optional emphasis line shown in larger type. */
  highlight?: string
}

export interface LessonSceneAction {
  label: string
  targetId?: BodyId
  scaleMode?: ScaleMode
  daysPerSecond?: number
  showOrbitFlow?: boolean
}

export type WhatIfId = 'two-moons' | 'earth-jupiter-size' | 'no-sun' | 'no-rotation'

export interface WhatIfScenario {
  id: WhatIfId
  title: string
  question: string
  explanation: string
  takeaway: string
  emoji: string
}

export interface TourStage {
  id: string
  title: string
  narration: string
  targetId: FocusTargetId | null
  distanceScale: number
  duration: number
  /** Optional side effects applied when the stage begins. */
  apply?: {
    daysPerSecond?: number
    scaleMode?: ScaleMode
    showOrbitFlow?: boolean
    showAsteroidBelt?: boolean
  }
}

export interface TravelDestination {
  id: BodyId
  name: string
  description: string
  /** Approximate one-way light time from Earth, in minutes. */
  lightMinutesFromEarth: number
  funFact: string
}
