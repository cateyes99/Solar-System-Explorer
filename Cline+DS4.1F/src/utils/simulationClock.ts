import { daysSinceJ2000 } from './astronomy'

/**
 * The authoritative simulation clock.
 *
 * Deliberately *mutable* and outside React: it is advanced once per rendered
 * frame, and the UI samples it a few times per second. Putting the clock in
 * React state would re-render the whole interface 60 times a second.
 */
class SimulationClock {
  /** Simulated wall-clock time in milliseconds (UTC). */
  private timeMs: number

  /** Total simulated days elapsed since the session started (also advances with speed). */
  private elapsedDays = 0

  /** Days simulated during the most recent frame, clamped for stability. */
  lastFrameDays = 0

  constructor() {
    this.timeMs = Date.now()
  }

  get date(): Date {
    return new Date(this.timeMs)
  }

  get time(): number {
    return this.timeMs
  }

  get daysSinceJ2000(): number {
    return daysSinceJ2000(this.timeMs)
  }

  get sessionDays(): number {
    return this.elapsedDays
  }

  setTime(timeMs: number): void {
    this.timeMs = timeMs
    this.elapsedDays = daysSinceJ2000(timeMs)
  }

  resetToNow(): void {
    this.setTime(Date.now())
  }

  /**
   * Advance by a real-time delta.
   *
   * `daysPerSecond` is the simulation speed. The per-frame step is clamped so
   * that at extreme speeds the planets keep a sensible, readable spin instead of
   * turning into a blur of aliasing.
   */
  advance(deltaSeconds: number, daysPerSecond: number, paused: boolean): void {
    if (paused || daysPerSecond === 0) {
      this.lastFrameDays = 0
      return
    }
    const rawDays = deltaSeconds * daysPerSecond
    const clampedDays = Math.max(-1.5, Math.min(1.5, rawDays))
    this.lastFrameDays = clampedDays
    this.timeMs += rawDays * 86_400_000
    this.elapsedDays += clampedDays
  }
}

export const clock = new SimulationClock()