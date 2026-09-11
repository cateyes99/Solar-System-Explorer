/**
 * The simulation clock is deliberately NOT part of React state: it advances every
 * frame, and reading it from useFrame avoids re-rendering React at 60 fps.
 * UI that displays the time polls it on a slow interval (see useSimulationDate).
 */
class SimulationClock {
  /** Simulated days elapsed since the page was opened. */
  simDays = 0
  /** Real moment the page was opened — the simulation starts at "today". */
  readonly epochMs = Date.now()

  advance(days: number): void {
    this.simDays += days
  }

  reset(): void {
    this.simDays = 0
  }

  /** Current simulated date as a JS timestamp. */
  get currentMs(): number {
    return this.epochMs + this.simDays * 86_400_000
  }
}

export const simClock = new SimulationClock()

export interface SpeedPreset {
  label: string
  /** Simulated days per real-time second. */
  daysPerSecond: number
  multiplier: string
}

/** "Normal" = 1 second of real time equals 1 simulated day. */
export const SPEEDS: readonly SpeedPreset[] = [
  { label: 'Slow', daysPerSecond: 0.2, multiplier: '0.2×' },
  { label: 'Normal', daysPerSecond: 1, multiplier: '1×' },
  { label: 'Fast', daysPerSecond: 7, multiplier: '7×' },
  { label: 'Very fast', daysPerSecond: 30, multiplier: '30×' },
  { label: 'Ultra', daysPerSecond: 365, multiplier: '365×' },
] as const
