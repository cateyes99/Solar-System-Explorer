import type { BodyId } from '../types'

/** Every procedurally generated texture the scene can request. */
export type TextureId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'venusClouds'
  | 'earth'
  | 'earthClouds'
  | 'earthNight'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'saturnRings'
  | 'uranus'
  | 'neptune'
  | 'moon'
  | 'glow'
  | 'nebula'
  | 'star'
  | 'comet'

export interface AtmosphereVisuals {
  color: string
  /** Overall strength of the rim glow. */
  intensity: number
  /** Higher values pull the glow closer to the limb. */
  power: number
  /** Optional second, wider haze layer (used by Venus and the gas giants). */
  hazeColor?: string
  hazeIntensity?: number
}

export interface CloudVisuals {
  textureId: TextureId
  opacity: number
  /** Multiplier on the planet's own rotation speed. */
  speed: number
  color: string
}

export interface NightLightsVisuals {
  textureId: TextureId
  intensity: number
  color: string
}

export interface RingVisuals {
  textureId: TextureId
  innerRadiusScale: number
  outerRadiusScale: number
  opacity: number
  /** Extra tilt applied on top of the planet's axial tilt, in degrees. */
  extraTiltDeg: number
  shadows: boolean
}

export interface BodyVisuals {
  textureId: TextureId
  /** How rough the surface looks: 0 = mirror, 1 = matte. */
  roughness: number
  metalness: number
  /** Surface relief strength, when a bump map is generated. */
  bumpScale?: number
  /** Rotation offset so features (like the Great Red Spot) face nicely at start. */
  textureOffsetU: number
  emissive?: { color: string; intensity: number }
  atmosphere?: AtmosphereVisuals
  clouds?: CloudVisuals
  nightLights?: NightLightsVisuals
  rings?: RingVisuals
  /** Accent colour used for hover rims, labels and UI highlights. */
  accent: string
  /** Radius of the selection ring drawn on the ecliptic, in planet radii. */
  focusRingScale: number
}

export const BODY_VISUALS: Record<BodyId, BodyVisuals> = {
  sun: {
    textureId: 'sun',
    roughness: 0.85,
    metalness: 0,
    textureOffsetU: 0,
    emissive: { color: '#ff9a2e', intensity: 1.6 },
    accent: '#ffb347',
    focusRingScale: 1,
  },
  mercury: {
    textureId: 'mercury',
    roughness: 0.92,
    metalness: 0.02,
    bumpScale: 0.06,
    textureOffsetU: 0.18,
    accent: '#cbc4ba',
    focusRingScale: 2.4,
  },
  venus: {
    textureId: 'venus',
    roughness: 0.74,
    metalness: 0,
    textureOffsetU: 0.4,
    atmosphere: {
      color: '#f6e2a8',
      intensity: 0.85,
      power: 2.1,
      hazeColor: '#ffe9b0',
      hazeIntensity: 0.4,
    },
    clouds: { textureId: 'venusClouds', opacity: 0.9, speed: -6, color: '#f1dda6' },
    accent: '#f0d9a0',
    focusRingScale: 2.2,
  },
  earth: {
    textureId: 'earth',
    roughness: 0.68,
    metalness: 0.05,
    bumpScale: 0.045,
    textureOffsetU: 0.55,
    atmosphere: {
      color: '#66b6ff',
      intensity: 1.35,
      power: 2.6,
      hazeColor: '#8fd0ff',
      hazeIntensity: 0.55,
    },
    clouds: { textureId: 'earthClouds', opacity: 0.72, speed: 1.35, color: '#ffffff' },
    nightLights: { textureId: 'earthNight', intensity: 1.15, color: '#ffd79a' },
    accent: '#5cc8ff',
    focusRingScale: 2.4,
  },
  mars: {
    textureId: 'mars',
    roughness: 0.88,
    metalness: 0.02,
    bumpScale: 0.05,
    textureOffsetU: 0.3,
    atmosphere: { color: '#ff9d6d', intensity: 0.32, power: 3.4 },
    accent: '#ff9a6b',
    focusRingScale: 2.4,
  },
  jupiter: {
    textureId: 'jupiter',
    roughness: 0.82,
    metalness: 0,
    bumpScale: 0.02,
    textureOffsetU: 0.42,
    atmosphere: {
      color: '#f0d3a4',
      intensity: 0.5,
      power: 2.8,
      hazeColor: '#c9a273',
      hazeIntensity: 0.35,
    },
    accent: '#e8c48d',
    focusRingScale: 2.1,
  },
  saturn: {
    textureId: 'saturn',
    roughness: 0.84,
    metalness: 0,
    bumpScale: 0.02,
    textureOffsetU: 0.2,
    atmosphere: {
      color: '#f3e2b8',
      intensity: 0.45,
      power: 2.9,
      hazeColor: '#e2cd9c',
      hazeIntensity: 0.3,
    },
    rings: {
      textureId: 'saturnRings',
      innerRadiusScale: 1.28,
      outerRadiusScale: 2.35,
      opacity: 0.95,
      extraTiltDeg: 0,
      shadows: true,
    },
    accent: '#f0dfae',
    focusRingScale: 2.1,
  },
  uranus: {
    textureId: 'uranus',
    roughness: 0.78,
    metalness: 0,
    textureOffsetU: 0.1,
    atmosphere: {
      color: '#a9f0f2',
      intensity: 0.6,
      power: 2.7,
      hazeColor: '#8fe6ea',
      hazeIntensity: 0.35,
    },
    rings: {
      textureId: 'saturnRings',
      innerRadiusScale: 1.55,
      outerRadiusScale: 1.95,
      opacity: 0.35,
      extraTiltDeg: 0,
      shadows: false,
    },
    accent: '#a9ecf0',
    focusRingScale: 2.2,
  },
  neptune: {
    textureId: 'neptune',
    roughness: 0.76,
    metalness: 0,
    textureOffsetU: 0.6,
    atmosphere: {
      color: '#6f8dff',
      intensity: 0.75,
      power: 2.6,
      hazeColor: '#5a76ff',
      hazeIntensity: 0.45,
    },
    accent: '#7d95ff',
    focusRingScale: 2.2,
  },
  moon: {
    textureId: 'moon',
    roughness: 0.95,
    metalness: 0,
    bumpScale: 0.07,
    textureOffsetU: 0.05,
    accent: '#d8d4cd',
    focusRingScale: 2.4,
  },
  comet: {
    textureId: 'comet',
    roughness: 0.9,
    metalness: 0,
    textureOffsetU: 0,
    emissive: { color: '#8fe8ff', intensity: 0.5 },
    atmosphere: { color: '#bdf3ff', intensity: 0.9, power: 2.4 },
    accent: '#bff4ff',
    focusRingScale: 3,
  },
  belt: {
    textureId: 'comet',
    roughness: 0.95,
    metalness: 0,
    textureOffsetU: 0,
    accent: '#cbb89a',
    focusRingScale: 2.4,
  },
}
