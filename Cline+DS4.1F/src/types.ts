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
  | 'moon'
  | 'belt'
  | 'comet'

/** Every body that can be orbited, focused and followed. */
export type FocusTargetId = BodyId | 'spacecraft'

export type BodyKind = 'star' | 'planet' | 'moon' | 'belt' | 'comet'

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
