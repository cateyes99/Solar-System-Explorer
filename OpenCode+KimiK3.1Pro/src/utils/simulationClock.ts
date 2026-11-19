export const SPEEDS = [
  { name: 'Slow', daysPerSecond: 0.1 },
  { name: 'Normal', daysPerSecond: 1 },
  { name: 'Fast', daysPerSecond: 30 },
  { name: 'Very fast', daysPerSecond: 365 },
] as const

const epoch = Date.now()

export const simulationClock = {
  days: 0,
  lastPublishedAt: 0,
}

export function advanceClock(delta: number, daysPerSecond: number): number {
  simulationClock.days += Math.min(delta, 0.1) * daysPerSecond
  return simulationClock.days
}

export function jumpClock(days: number): number {
  simulationClock.days += days
  return simulationClock.days
}

export function resetClock(): void {
  simulationClock.days = 0
  simulationClock.lastPublishedAt = 0
}

export function getSimulationDate(days = simulationClock.days): Date {
  return new Date(epoch + days * 86_400_000)
}

export function getOrbitalAngle(periodDays: number, phase = 0): number {
  if (periodDays <= 0) return phase
  return phase + (simulationClock.days / periodDays) * Math.PI * 2
}
