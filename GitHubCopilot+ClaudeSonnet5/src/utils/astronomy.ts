/**
 * Time and orbital-mechanics helpers. All angles are in radians. Orbital
 * motion is simplified to circular, coplanar orbits — accurate enough for an
 * educational visualization, not a physics simulator (see spec \u00a724).
 */

const REFERENCE_DATE = new Date(Date.UTC(2000, 0, 1))
const MS_PER_DAY = 86_400_000

export function simDateFromDays(simTimeDays: number): Date {
  return new Date(REFERENCE_DATE.getTime() + simTimeDays * MS_PER_DAY)
}

export function formatSimDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const TWO_PI = Math.PI * 2

/** Angle (radians) of a body's position along its orbit at a given simulated time. */
export function orbitalAngle(simTimeDays: number, orbitalPeriodDays: number, phaseOffset = 0): number {
  const progress = simTimeDays / orbitalPeriodDays
  return phaseOffset + progress * TWO_PI
}

/** Axial rotation angle (radians). Negative rotationPeriodHours naturally yields retrograde spin. */
export function rotationAngle(simTimeDays: number, rotationPeriodHours: number, phaseOffset = 0): number {
  const hours = simTimeDays * 24
  const progress = hours / rotationPeriodHours
  return phaseOffset + progress * TWO_PI
}

export function orbitPosition(distance: number, angle: number, inclinationRad = 0): [number, number, number] {
  const x = Math.cos(angle) * distance
  const z = Math.sin(angle) * distance
  const y = Math.sin(angle) * distance * Math.sin(inclinationRad)
  return [x, y, z]
}

export const MOON_PHASES = [
  { name: 'New Moon', illumination: 0 },
  { name: 'Waxing Crescent', illumination: 0.25 },
  { name: 'First Quarter', illumination: 0.5 },
  { name: 'Waxing Gibbous', illumination: 0.75 },
  { name: 'Full Moon', illumination: 1 },
  { name: 'Waning Gibbous', illumination: 0.75 },
  { name: 'Last Quarter', illumination: 0.5 },
  { name: 'Waning Crescent', illumination: 0.25 },
] as const

export interface MoonPhaseState {
  name: string
  /** 0 = new moon (dark), 1 = full moon (fully lit). */
  illumination: number
  /** 0..1 progress through the full cycle, used to decide which side is lit. */
  cycleProgress: number
}

export function computeMoonPhase(simTimeDays: number, orbitalPeriodDays: number): MoonPhaseState {
  const cycle = ((simTimeDays % orbitalPeriodDays) + orbitalPeriodDays) % orbitalPeriodDays
  const cycleProgress = cycle / orbitalPeriodDays
  const index = Math.floor(cycleProgress * MOON_PHASES.length) % MOON_PHASES.length
  const phase = MOON_PHASES[index]
  return { name: phase.name, illumination: phase.illumination, cycleProgress }
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}
