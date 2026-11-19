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

export interface PlanetData {
  id: BodyId
  name: string
  type: string
  diameterKm: number
  distanceFromSunKm: number
  orbitalPeriodDays: number
  rotationPeriodHours: number
  moons: number
  temperatureC: number
  color: string
  accentColor: string
  description: string
  facts: string[]
  didYouKnow: string
  educationalRadius: number
  orbitRadius: number
  inclinationDeg: number
  axialTiltDeg: number
  phase: number
}

export type ScaleMode = 'educational' | 'relative' | 'distances' | 'custom'
export type CameraMode = 'system' | 'planet' | 'follow' | 'spacecraft'
export type Quality = 'auto' | 'high' | 'low'
export type ModalId = 'learn' | 'settings' | 'what-if' | 'fact' | 'scale' | 'shortcuts' | null
export type WhatIfScenario = 'two-moons' | 'giant-earth' | 'no-sun' | 'no-rotation'
export type LessonId = 'sun' | 'sizes' | 'distances' | 'gravity' | 'day-night' | 'seasons' | 'moon-phases' | 'orbits'

export interface TourStop {
  body: BodyId | null
  eyebrow: string
  title: string
  narration: string
  duration: number
}

export interface ToastMessage {
  id: number
  text: string
  icon?: 'sparkle' | 'earth' | 'sun' | 'rocket'
}
