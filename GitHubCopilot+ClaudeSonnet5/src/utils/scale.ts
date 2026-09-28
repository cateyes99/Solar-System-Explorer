import type { Planet, PlanetId } from '../data/planets'

export type ScaleMode = 'educational' | 'relative' | 'distance' | 'custom'

export interface OrbitLayoutEntry {
  radius: number
  orbitDistance: number
}

export type OrbitLayout = Map<PlanetId, OrbitLayoutEntry>

export interface ScaleModeInfo {
  id: ScaleMode
  label: string
  description: string
}

export const SCALE_MODES: ScaleModeInfo[] = [
  {
    id: 'educational',
    label: 'Educational Scale',
    description: 'A balanced view designed for learning \u2014 every planet is clearly visible and spaced out.',
  },
  {
    id: 'relative',
    label: 'Relative Size',
    description: 'Planet sizes are proportional to each other so you can compare them directly. Distances are compressed.',
  },
  {
    id: 'distance',
    label: 'Distances Emphasized',
    description: 'Planets shrink so you can appreciate just how far apart they really are.',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Adjust size and distance exaggeration yourself with the sliders below.',
  },
]

const AU_KM = 149_600_000
const EARTH_DIAMETER_KM = 12_742

interface ModeTuning {
  sizeExponent: number
  sizeMultiplier: number
  distanceExponent: number
  distanceMultiplier: number
  minGap: number
  sunRadius: number
}

const TUNING: Record<Exclude<ScaleMode, 'custom'>, ModeTuning> = {
  educational: { sizeExponent: 0.45, sizeMultiplier: 1, distanceExponent: 0.55, distanceMultiplier: 11, minGap: 1.9, sunRadius: 3.2 },
  relative: { sizeExponent: 1, sizeMultiplier: 0.55, distanceExponent: 0.4, distanceMultiplier: 10, minGap: 2.6, sunRadius: 4.4 },
  distance: { sizeExponent: 0.24, sizeMultiplier: 0.8, distanceExponent: 0.8, distanceMultiplier: 9, minGap: 3.2, sunRadius: 2.4 },
}

export interface CustomScaleSettings {
  sizeExaggeration: number
  distanceExaggeration: number
}

export const DEFAULT_CUSTOM_SCALE: CustomScaleSettings = {
  sizeExaggeration: 1,
  distanceExaggeration: 1,
}

function tuningFor(mode: ScaleMode, custom: CustomScaleSettings): ModeTuning {
  if (mode !== 'custom') return TUNING[mode]
  const base = TUNING.educational
  return {
    ...base,
    sizeMultiplier: base.sizeMultiplier * custom.sizeExaggeration,
    distanceMultiplier: base.distanceMultiplier * custom.distanceExaggeration,
  }
}

/** Scene units for a planet's visual radius (Earth = 1 unit baseline before multiplier). */
export function planetSceneRadius(
  planet: Pick<Planet, 'diameterKm'>,
  mode: ScaleMode,
  custom: CustomScaleSettings = DEFAULT_CUSTOM_SCALE,
): number {
  const tuning = tuningFor(mode, custom)
  const ratio = planet.diameterKm / EARTH_DIAMETER_KM
  return Math.pow(ratio, tuning.sizeExponent) * tuning.sizeMultiplier
}

export function sunSceneRadius(mode: ScaleMode, custom: CustomScaleSettings = DEFAULT_CUSTOM_SCALE): number {
  const tuning = tuningFor(mode, custom)
  return tuning.sunRadius * (mode === 'custom' ? Math.sqrt(custom.sizeExaggeration) : 1)
}

/**
 * Computes final, non-overlapping orbital radii for every planet in one pass.
 * Raw distances come from a power-law compression of the real AU distance, then
 * a minimum-spacing pass pushes planets outward as needed so bodies never
 * visually intersect regardless of how aggressive the exponents are.
 */
export function computeOrbitLayout(
  planets: Planet[],
  mode: ScaleMode,
  custom: CustomScaleSettings = DEFAULT_CUSTOM_SCALE,
): OrbitLayout {
  const tuning = tuningFor(mode, custom)
  const sorted = [...planets].sort((a, b) => a.distanceFromSunKm - b.distanceFromSunKm)

  const result: OrbitLayout = new Map()
  let prevOuterEdge = sunSceneRadius(mode, custom)

  for (const planet of sorted) {
    const radius = planetSceneRadius(planet, mode, custom)
    const au = planet.distanceFromSunKm / AU_KM
    const rawDistance = Math.pow(au, tuning.distanceExponent) * tuning.distanceMultiplier
    const minDistance = prevOuterEdge + tuning.minGap + radius
    const orbitDistance = Math.max(rawDistance, minDistance)
    result.set(planet.id, { radius, orbitDistance })
    prevOuterEdge = orbitDistance + radius
  }

  return result
}

/** The Moon needs its own local scale since Earth-Moon distance is tiny next to interplanetary distances. */
export function moonOrbitRadius(earthSceneRadius: number, mode: ScaleMode): number {
  switch (mode) {
    case 'relative':
      return earthSceneRadius * 2.1
    case 'distance':
      return earthSceneRadius * 4.4
    default:
      return earthSceneRadius * 2.8
  }
}

export function moonSceneRadius(earthSceneRadius: number): number {
  return earthSceneRadius * 0.27
}

export const OUTER_SYSTEM_EDGE_MARGIN = 12
