/**
 * Shared domain types for the Solar System Explorer.
 *
 * Scientific values live in `src/data/*` and are kept strictly separate from
 * presentation concerns. All real-world numbers are approximate means (J2000
 * epoch) taken from standard astronomy references.
 */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export type BodyId = PlanetId | 'sun' | 'moon' | 'comet'

/** Which family of surface texture to procedurally generate. */
export type SurfaceKind = 'cratered' | 'cloudy' | 'terran' | 'desert' | 'banded' | 'ice' | 'star'

export type RingStyle = 'none' | 'rocky' | 'icy' | 'shepherd'

export interface Planet {
  id: PlanetId
  name: string
  /** Friendly classification shown in the UI. */
  type: string
  /** Child friendly one-liner shown under the name. */
  tagline: string

  /* ---- Real astronomy (approximate means) ---- */
  diameterKm: number
  /** Semi-major axis, astronomical units. */
  semiMajorAxisAU: number
  eccentricity: number
  inclinationDeg: number
  orbitalPeriodDays: number
  /** Sidereal rotation period. Negative values are retrograde. */
  rotationPeriodHours: number
  moonCount: number
  /** Mean surface / cloud-top temperature in °C. */
  meanTempC: number
  /** Range used for the info panel, e.g. "−140 °C". */
  tempLabel: string
  axialTiltDeg: number
  /** Known moon names, best effort. Truncated to a few highlights. */
  notableMoons: string[]
  funFacts: string[]
  didYouKnow: string
  /** Longer paragraph used in the info panel. */
  description: string

  /* ---- Presentation ---- */
  color: string
  accentColor: string
  surfaceKind: SurfaceKind
  ringStyle: RingStyle
  /** Inner / outer ring radii as a fraction of the planet's radius. */
  ringInnerFactor: number
  ringOuterFactor: number
  hasAtmosphere: boolean
  atmosphereColor: string
  /** 0..1, how strongly the rim glow reads. */
  atmosphereStrength: number
}

export interface MoonDef {
  id: string
  name: string
  parentId: PlanetId
  diameterKm: number
  /** Distance from the parent, in kilometres. */
  distanceKm: number
  orbitalPeriodDays: number
  phase: number
  color: string
  surfaceKind: SurfaceKind
}

export interface StarFact {
  id: string
  title: string
  body: string
  /** Rough difficulty so kids can filter out the grown-up stuff. */
  level: 'easy' | 'amazing'
}

/* ---------- Scale modes ---------- */

export type ScaleMode = 'educational' | 'relative-size' | 'distances' | 'custom'

export interface ScaleSettings {
  mode: ScaleMode
  /** Exponent applied to planet diameters. 1 = true relative size. */
  sizeExponent: number
  /** Exponent applied to orbital distances. 1 = true relative distances. */
  distanceExponent: number
}

/* ---------- Camera / interaction ---------- */

export type CameraMode = 'free' | 'view-planet' | 'follow'

export type OverlayPanel =
  | 'planet'
  | 'learn'
  | 'whatif'
  | 'missions'
  | 'scale'
  | 'settings'
  | 'help'
  | null

export type LessonId =
  | 'sun'
  | 'sizes'
  | 'distances'
  | 'gravity'
  | 'day-night'
  | 'seasons'
  | 'moon-phases'
  | 'orbits'

export type WhatIfId = 'two-moons' | 'earth-jupiter' | 'no-sun' | 'no-rotation'

/* ---------- Tour ---------- */

export interface TourStage {
  id: string
  title: string
  narration: string
  /** Body the camera focuses on, or `system` for the wide shot. */
  target: BodyId | 'system'
  /** Extra dolly offset applied on top of the computed framing distance. */
  distanceFactor: number
  /** Radians of azimuth swept while the stage is on screen. */
  sweep: number
  /** Seconds the stage is shown before auto-advancing. */
  duration: number
}