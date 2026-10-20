import type { BodyId } from './types'

/** Presentation-only settings for each body (kept apart from the science data). */
export interface AtmosphereVisual {
  color: string
  intensity: number
  /** Shell size relative to the planet radius. */
  scale: number
}

export interface BodyVisual {
  atmosphere?: AtmosphereVisual
  /** Fresnel tint on the surface itself (e.g. Earth’s blue rim). */
  rim?: { color: string; strength: number }
  clouds?: boolean
  rings?: 'saturn' | 'uranus'
  ambient: number
  segments: number
}

export const VISUALS: Record<BodyId, BodyVisual> = {
  sun: { ambient: 1, segments: 64 },
  mercury: { ambient: 0.05, segments: 48 },
  venus: {
    ambient: 0.05,
    segments: 48,
    atmosphere: { color: '#ffd9a0', intensity: 0.9, scale: 1.1 },
    rim: { color: '#fff0c8', strength: 0.35 },
  },
  earth: {
    ambient: 0.04,
    segments: 64,
    clouds: true,
    atmosphere: { color: '#5aa8ff', intensity: 1.3, scale: 1.09 },
    rim: { color: '#7fb8ff', strength: 0.6 },
  },
  mars: {
    ambient: 0.05,
    segments: 48,
    atmosphere: { color: '#ff9a6a', intensity: 0.35, scale: 1.05 },
  },
  jupiter: {
    ambient: 0.05,
    segments: 64,
    atmosphere: { color: '#f3d9b0', intensity: 0.45, scale: 1.05 },
    rim: { color: '#fff1d6', strength: 0.2 },
  },
  saturn: {
    ambient: 0.05,
    segments: 64,
    rings: 'saturn',
    atmosphere: { color: '#f5e2b0', intensity: 0.4, scale: 1.05 },
  },
  uranus: {
    ambient: 0.06,
    segments: 48,
    rings: 'uranus',
    atmosphere: { color: '#b8f4ff', intensity: 0.6, scale: 1.07 },
    rim: { color: '#d4fbff', strength: 0.3 },
  },
  neptune: {
    ambient: 0.06,
    segments: 48,
    atmosphere: { color: '#6f95ff', intensity: 0.7, scale: 1.07 },
    rim: { color: '#8fb0ff', strength: 0.3 },
  },
  moon: { ambient: 0.04, segments: 32 },
}
