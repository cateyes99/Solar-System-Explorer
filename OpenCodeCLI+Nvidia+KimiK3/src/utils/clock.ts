/**
 * Mutable simulation clock shared by the 3D scene.
 * Kept outside React state so per-frame updates never trigger re-renders.
 */
export const simClock = {
  days: 0,
  /** simulated days per real second */
  speed: 1,
  paused: false,
}

export const SPEED_PRESETS = [
  { label: 'Slow', daysPerSecond: 0.2 },
  { label: 'Normal', daysPerSecond: 1 },
  { label: 'Fast', daysPerSecond: 30 },
  { label: 'Very Fast', daysPerSecond: 365 },
] as const

const EPOCH = Date.UTC(2024, 0, 1)

export function simDate(days: number): Date {
  return new Date(EPOCH + days * 86_400_000)
}
