import type { BodyId, CelestialBody, CustomScale, FocusTargetId, ScaleMode, SatelliteDefinition } from '../types'
import { AU_KM } from './astronomy'
import { NEPTUNE, EARTH, BODY_BY_ID } from '../data/planets'
import { clamp } from './random'

/**
 * The "Educational Scale".
 *
 * A physically exact Solar System cannot be taught on a screen: to keep Earth
 * visible the Sun would have to be 100× wider, and to keep it on screen Neptune
 * would fall off the edge of the world. So we use a deliberately designed,
 * clearly explained scale with three presets (plus a custom mode).
 *
 *  - `educational`  : compressed sizes and compressed orbits (default).
 *  - `relativeSize` : planet sizes are true relative to each other, so children
 *                     can see how small Mercury really is next to Jupiter.
 *  - `distances`    : orbit spacing is true relative spacing (linear in AU),
 *                     which is what the real Solar System looks like — crowded
 *                     in the middle and almost empty outside.
 *  - `custom`       : the child controls the compression themselves.
 */

export const EARTH_DIAMETER_KM = 12_742
const MAX_AU = NEPTUNE.semiMajorAxisKm / AU_KM
const MIN_PLANET_RADIUS = 0.16

export const DEFAULT_CUSTOM_SCALE: CustomScale = {
  sizeExponent: 0.42,
  orbitSpread: 1,
  sunRadius: 3.4,
}

export function sunRadiusFor(mode: ScaleMode, custom: CustomScale): number {
  switch (mode) {
    case 'relativeSize':
      // The Sun is really 109 Earths wide. We draw it a little smaller so the
      // true planet sizes stay visible, and the UI says so out loud.
      return 4.6
    case 'custom':
      return clamp(custom.sunRadius, 1.6, 9)
    default:
      return 3.4
  }
}

/** Visual radius of a planet or moon, in scene units. */
export function bodyRadius(body: CelestialBody, mode: ScaleMode, custom: CustomScale): number {
  if (body.id === 'sun') return sunRadiusFor(mode, custom)

  const ratio = body.diameterKm / EARTH_DIAMETER_KM

  if (body.kind === 'moon') {
    const parentId = body.parentId ?? 'earth'
    const parentRadius = radiusOfId(parentId, mode, custom)
    // Moon sizes are exaggerated so they do not vanish, but the family order
    // (our Moon smaller than Mercury, Ganymede bigger than Mercury) is preserved.
    return Math.max(0.05, parentRadius * Math.pow(ratio / 0.2727, 0.55) * 0.36)
  }

  if (mode === 'relativeSize') {
    // True relative sizes: Earth = 0.34 units, Jupiter ≈ 3.73 units.
    return 0.34 * ratio
  }

  const exponent = mode === 'custom' ? clamp(custom.sizeExponent, 0.15, 1) : 0.42
  return Math.max(MIN_PLANET_RADIUS, 0.62 * Math.pow(ratio, exponent))
}

const PARENT_DIAMETER_KM: Record<string, number> = {
  sun: 1_392_700,
  mercury: 4_879,
  venus: 12_104,
  earth: EARTH.diameterKm,
  mars: 6_779,
  jupiter: 139_820,
  saturn: 116_460,
  uranus: 50_724,
  neptune: 49_244,
  pluto: 2_377,
}

function radiusOfId(id: BodyId, mode: ScaleMode, custom: CustomScale): number {
  const diameter = PARENT_DIAMETER_KM[id] ?? EARTH.diameterKm
  return bodyRadius({ ...EARTH, id, diameterKm: diameter }, mode, custom)
}

/** Visual orbital radius (distance from the Sun) in scene units. */
export function orbitRadiusFor(body: CelestialBody, mode: ScaleMode, custom: CustomScale): number {
  if (body.kind === 'star') return 0
  const au = body.semiMajorAxisKm / AU_KM

  if (mode === 'distances') {
    return 12 + 74 * (au / MAX_AU)
  }

  const compressed = 9 + 66 * Math.pow(au / MAX_AU, 0.55)
  if (mode === 'custom') {
    return 9 + (compressed - 9) * clamp(custom.orbitSpread, 0.4, 2.6)
  }
  return compressed
}

/** Visual radius of a moon's orbit around its parent, in scene units. */
export function satelliteOrbitRadius(satellite: SatelliteDefinition, parentRadius: number): number {
  const parentRadiusKm = (PARENT_DIAMETER_KM[satellite.parentId] ?? EARTH.diameterKm) / 2
  const ratio = satellite.orbitalRadiusKm / parentRadiusKm
  return parentRadius * (1.7 + 0.8 * Math.pow(Math.max(ratio, 1), 0.5))
}

/** Visual radius of a moon, in scene units. */
export function satelliteRadius(satellite: SatelliteDefinition, parentRadius: number): number {
  const parentDiameterKm = PARENT_DIAMETER_KM[satellite.parentId] ?? EARTH.diameterKm
  const ratio = satellite.diameterKm / parentDiameterKm
  return Math.max(0.035, parentRadius * Math.pow(Math.max(ratio, 0.0001), 0.5) * 0.5)
}

/** Radius of the asteroid belt in scene units (2.2 – 3.3 AU). */
export function asteroidBeltRadii(mode: ScaleMode, custom: CustomScale): [number, number] {
  const inner = orbitRadiusFor({ ...NEPTUNE, semiMajorAxisKm: 2.2 * AU_KM }, mode, custom)
  const outer = orbitRadiusFor({ ...NEPTUNE, semiMajorAxisKm: 3.3 * AU_KM }, mode, custom)
  return [inner, outer]
}

/**
 * Kilometres per scene unit, measured at Neptune's orbit. Used to translate
 * spacecraft speed and distance read-outs into human units.
 */
export function kmPerUnit(mode: ScaleMode, custom: CustomScale): number {
  const neptuneOrbit = orbitRadiusFor(NEPTUNE, mode, custom)
  return NEPTUNE.semiMajorAxisKm / Math.max(neptuneOrbit, 1)
}

/**
 * Maps any distance from the Sun (in km) into scene units using the active
 * layout. Used for elliptical orbits, where the real distance changes as the
 * planet travels around the Sun.
 */
export function scaleDistanceKm(km: number, mode: ScaleMode, custom: CustomScale): number {
  if (km <= 0) return 0
  return orbitRadiusFor({ ...NEPTUNE, semiMajorAxisKm: km }, mode, custom)
}

/**
 * Maps a heliocentric ecliptic position (km, J2000) into scene coordinates.
 *
 * The radial compression is applied to the position's distance, so a body always
 * sits exactly on the orbit line drawn from the same elements. The ecliptic's
 * north (z) becomes the scene's up (y), and its in-plane y becomes the scene's
 * −z, matching the way the anti-clockwise motion reads from ecliptic north.
 */
export function sceneFromEclipticKm(
  xKm: number,
  yKm: number,
  zKm: number,
  mode: ScaleMode,
  custom: CustomScale,
): { x: number; y: number; z: number } {
  const distance = Math.hypot(xKm, yKm, zKm)
  const factor = distance > 0 ? scaleDistanceKm(distance, mode, custom) / distance : 0
  return { x: xKm * factor, y: zKm * factor, z: -yKm * factor }
}

/** Visual radius for any focusable object, used to frame the camera nicely. */
export function visualRadiusOf(id: FocusTargetId, mode: ScaleMode, custom: CustomScale): number {
  if (id === 'spacecraft') return 0.6
  if (id === 'belt') {
    const [inner, outer] = asteroidBeltRadii(mode, custom)
    return Math.max(6, (outer - inner) * 0.75)
  }
  const body = BODY_BY_ID[id]
  if (!body) return 1
  if (body.kind === 'belt') return 14
  // A comet's nucleus is only a few kilometres across, but the thing worth
  // flying to see is the coma and the tails, which are far larger. Framing on
  // the nucleus alone would put the camera right on top of it.
  if (body.kind === 'comet') return 0.5
  return bodyRadius(body, mode, custom)
}

export const SCALE_MODE_INFO: Record<
  ScaleMode,
  { title: string; description: string; caveat: string }
> = {
  educational: {
    title: 'Educational Scale',
    description:
      'Planet sizes and the gaps between orbits are gently squeezed so everything fits into one beautiful view. Perfect for learning the order of the planets.',
    caveat: 'Sizes and distances are both compressed — this view is not to scale.',
  },
  relativeSize: {
    title: 'Relative Size',
    description:
      'Every planet is drawn at its true size compared with the other planets. Jupiter really is 11 Earths wide, and Mercury really is that tiny.',
    caveat:
      'Planet sizes are true relative to each other. Orbits are compressed and the Sun is drawn smaller than reality.',
  },
  distances: {
    title: 'Distances Emphasized',
    description:
      'Orbit spacing now matches the real distances. Notice how the inner planets crowd around the Sun while the outer giants sit alone in the dark.',
    caveat:
      'Orbit spacing is true to the real distances. Planet sizes are compressed so they stay visible.',
  },
  custom: {
    title: 'Custom Scale',
    description:
      'You are in charge. Squeeze the planets or spread the orbits out and watch how the picture changes.',
    caveat: 'Custom settings — definitely not to scale. The real numbers always appear in the planet panel.',
  },
}

export const SCALE_MODE_ORDER: ScaleMode[] = ['educational', 'relativeSize', 'distances', 'custom']