import { BODIES, EARTH_DIAMETER_KM, PLANET_IDS } from '../data/planets'
import type { BodyId, PlanetId } from '../data/types'

export type ScaleMode = 'educational' | 'relative' | 'distance' | 'custom'

export interface CustomScale {
  /** Earth’s radius in scene units. */
  planetSize: number
  /** 0.3 = sizes squashed together, 1 = true relative sizes. */
  sizeRealism: number
  distanceSpread: number
  /** 0.4 = distances squashed together, 1 = true relative distances. */
  distanceRealism: number
}

export interface LayoutOverrides {
  earthMatchesJupiter?: boolean
}

export interface SceneLayout {
  radius: Record<BodyId, number>
  orbit: Record<PlanetId, number>
  moonOrbit: number
  beltInner: number
  beltOuter: number
  outerEdge: number
}

export const DEFAULT_CUSTOM_SCALE: CustomScale = {
  planetSize: 0.9,
  sizeRealism: 0.6,
  distanceSpread: 1,
  distanceRealism: 0.6,
}

export const SCALE_MODES: { id: ScaleMode; label: string; description: string }[] = [
  {
    id: 'educational',
    label: 'Educational Scale',
    description: 'Planets are enlarged and distances squeezed so everything is easy to see and compare.',
  },
  {
    id: 'relative',
    label: 'Relative Size',
    description: 'The Sun and planets are shown at their true sizes compared with each other. Distances are still squeezed.',
  },
  {
    id: 'distance',
    label: 'Distances Emphasized',
    description: 'Distances from the Sun are truly proportional – see how empty space really is! Planets are enlarged so you can still find them.',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Choose your own mix of sizes and distances with the sliders.',
  },
]

const RING_EXTENT = 2.35
const MOON_RADIUS_RATIO = 0.3
const MOON_ORBIT_RATIO = 2.6

interface ScaleRecipe {
  size: (diameterRatio: number) => number
  sunRadius: number
  distance: (au: number) => number
}

function recipeFor(mode: ScaleMode, custom: CustomScale): ScaleRecipe {
  switch (mode) {
    case 'relative':
      return { size: (d) => 0.42 * d, sunRadius: 0.42 * (BODIES.sun.diameterKm / EARTH_DIAMETER_KM), distance: (au) => 52 + 26 * au ** 0.55 }
    case 'distance':
      return { size: (d) => 0.32 * d ** 0.5, sunRadius: 2.6, distance: (au) => 20 * au }
    case 'custom': {
      const sunRadius = Math.min(custom.planetSize * (BODIES.sun.diameterKm / EARTH_DIAMETER_KM) ** custom.sizeRealism, 60)
      return {
        size: (d) => custom.planetSize * d ** custom.sizeRealism,
        sunRadius,
        distance: (au) => sunRadius * 1.6 + custom.distanceSpread * 22 * au ** custom.distanceRealism,
      }
    }
    case 'educational':
    default:
      return { size: (d) => 0.9 * d ** 0.5, sunRadius: 5.5, distance: (au) => 10 + 22 * au ** 0.5 }
  }
}

export function computeLayout(mode: ScaleMode, custom: CustomScale, overrides: LayoutOverrides = {}): SceneLayout {
  const recipe = recipeFor(mode, custom)
  const radius = {} as Record<BodyId, number>
  const orbit = {} as Record<PlanetId, number>

  radius.sun = recipe.sunRadius
  for (const id of PLANET_IDS) {
    radius[id] = recipe.size(BODIES[id].diameterKm / EARTH_DIAMETER_KM)
  }
  if (overrides.earthMatchesJupiter) radius.earth = radius.jupiter

  const normalEarth = recipe.size(1)
  radius.moon = normalEarth * MOON_RADIUS_RATIO
  const moonOrbit = Math.max(normalEarth * MOON_ORBIT_RATIO, radius.earth * 1.6 + radius.moon * 2)

  // Push orbits apart so that no planet (with rings or moon) overlaps its neighbour.
  let prevOrbit = 0
  let prevExtent = recipe.sunRadius * 1.35
  for (const id of PLANET_IDS) {
    const r = radius[id]
    let extent = r
    if (id === 'saturn') extent = r * RING_EXTENT
    if (id === 'earth') extent = Math.max(r, moonOrbit + radius.moon)
    const wanted = recipe.distance(BODIES[id].orbit?.semiMajorAxisAU ?? 1)
    const minimum = prevOrbit + prevExtent + extent + 0.6
    orbit[id] = Math.max(wanted, minimum)
    prevOrbit = orbit[id]
    prevExtent = extent
  }

  const marsEdge = orbit.mars + radius.mars + 1
  const jupiterEdge = orbit.jupiter - radius.jupiter - 1.5
  const layoutSoFar = { orbit } as SceneLayout
  const beltInner = Math.max(auToScene(layoutSoFar, 2.2), marsEdge)
  const beltOuter = Math.max(Math.min(auToScene(layoutSoFar, 3.3), jupiterEdge), beltInner + 1)

  return {
    radius,
    orbit,
    moonOrbit,
    beltInner,
    beltOuter,
    outerEdge: orbit.neptune + radius.neptune,
  }
}

function distancePoints(layout: Pick<SceneLayout, 'orbit'>): [number, number][] {
  const points: [number, number][] = [[0, 0]]
  for (const id of PLANET_IDS) {
    points.push([BODIES[id].orbit?.semiMajorAxisAU ?? 0, layout.orbit[id]])
  }
  return points
}

function interpolate(points: [number, number][], value: number, from: 0 | 1): number {
  const to = from === 0 ? 1 : 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (value <= b[from] || i === points.length - 1) {
      const t = (value - a[from]) / (b[from] - a[from])
      return a[to] + t * (b[to] - a[to])
    }
  }
  return value
}

/** Map a real distance (AU) to scene units using the planets as anchors. */
export function auToScene(layout: Pick<SceneLayout, 'orbit'>, au: number): number {
  return interpolate(distancePoints(layout), au, 0)
}

/** Map a scene distance back to an approximate real distance in AU. */
export function sceneToAU(layout: Pick<SceneLayout, 'orbit'>, sceneDistance: number): number {
  return Math.max(0, interpolate(distancePoints(layout), sceneDistance, 1))
}

export function cloneLayout(layout: SceneLayout): SceneLayout {
  return {
    ...layout,
    radius: { ...layout.radius },
    orbit: { ...layout.orbit },
  }
}
