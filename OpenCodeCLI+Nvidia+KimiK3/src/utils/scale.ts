import type { Planet } from '../data/planets'

export type ScaleMode = 'educational' | 'relative' | 'distance' | 'custom'

export type ScaledBody = {
  planet: Planet
  /** visual radius in scene units */
  radius: number
  /** visual orbit radius in scene units */
  orbitRadius: number
}

const EARTH_RADII: Record<string, number> = {
  mercury: 0.38, venus: 0.95, earth: 1, mars: 0.53,
  jupiter: 11.2, saturn: 9.4, uranus: 4.0, neptune: 3.9,
}

const AU_KM = 149_600_000

/**
 * Educational scale: planets are big enough to see and explore,
 * orbit gaps grow gently outward. NOT physically accurate — on purpose.
 */
function educationalRadius(p: Planet): number {
  const r = EARTH_RADII[p.id] ?? 1
  // compress relative sizes so Jupiter doesn't fill the screen
  return 0.55 + Math.cbrt(r) * 0.75
}

function educationalOrbit(index: number): number {
  return 16 + index * 9 + Math.pow(index, 1.6) * 1.2
}

export function buildScale(
  planets: Planet[],
  mode: ScaleMode,
  customSize = 1,
  customDistance = 1,
): ScaledBody[] {
  return planets.map((planet, index) => {
    const rel = EARTH_RADII[planet.id] ?? 1
    const au = planet.distanceFromSunKm / AU_KM
    let radius: number
    let orbitRadius: number
    switch (mode) {
      case 'relative':
        // sizes accurate relative to each other; distances still compressed
        radius = Math.max(0.28, rel * 0.62)
        orbitRadius = educationalOrbit(index)
        break
      case 'distance':
        // distances proportional to real AU (compressed log), sizes educational
        radius = educationalRadius(planet) * 0.8
        orbitRadius = 14 + Math.pow(au, 0.62) * 26
        break
      case 'custom':
        radius = educationalRadius(planet) * customSize
        orbitRadius = educationalOrbit(index) * customDistance
        break
      case 'educational':
      default:
        radius = educationalRadius(planet)
        orbitRadius = educationalOrbit(index)
    }
    return { planet, radius, orbitRadius }
  })
}

export const SUN_RADIUS = 7

/** Deterministic position of a body on its circular orbit at a given sim-day. */
export function orbitalPosition(
  orbitRadius: number,
  orbitalPeriodDays: number,
  days: number,
  phase = 0,
): [number, number, number] {
  const angle = phase + (days / orbitalPeriodDays) * Math.PI * 2
  return [Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius]
}

export function formatKm(km: number): string {
  if (km >= 1_000_000_000) return `${(km / 1_000_000_000).toFixed(2)} billion km`
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)} million km`
  return `${km.toLocaleString()} km`
}
