/**
 * The simulation clock is deliberately *not* React state.
 *
 * Planet positions are derived from `simDays` every frame inside `useFrame`,
 * so keeping the value in a plain mutable object avoids triggering a React
 * render 60 times a second. The UI only receives a throttled snapshot.
 */

const MS_PER_DAY = 86_400_000

/** Fixed starting point for the orrery: 1 January 2026, 00:00 UTC. */
export const EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0)

/** Never advance by more than this much wall-clock time in one frame. */
const MAX_FRAME_SECONDS = 0.1

class SimulationClock {
  /** Simulated days since {@link EPOCH_MS}. */
  simDays = 0
  running = true
  /** Simulated days per real second. */
  daysPerSecond = 20
  private lastMs = 0

  /** Call once per frame. Returns the current simulated day count. */
  tick(nowMs: number): number {
    if (this.lastMs === 0) {
      this.lastMs = nowMs
      return this.simDays
    }
    if (this.running) {
      const dt = Math.min((nowMs - this.lastMs) / 1000, MAX_FRAME_SECONDS)
      this.simDays += dt * this.daysPerSecond
    }
    this.lastMs = nowMs
    return this.simDays
  }

  reset(ms: number): void {
    this.lastMs = 0
    void ms
  }

  /** Jump the orrery forward or backward. */
  advanceDays(days: number): void {
    this.simDays += days
  }

  /** Fractional orbit angle for a body, in radians. */
  angle(periodDays: number, phase = 0): number {
    const turns = this.simDays / periodDays + phase / (Math.PI * 2)
    return (turns * Math.PI * 2) % (Math.PI * 2)
  }

  /** How far a body has rotated on its axis, in radians. */
  spin(rotationPeriodHours: number): number {
    const hours = this.simDays * 24
    return ((hours / rotationPeriodHours) % 1) * Math.PI * 2
  }

  get simulatedMs(): number {
    return EPOCH_MS + this.simDays * MS_PER_DAY
  }
}

export const simClock = new SimulationClock()

export { MS_PER_DAY }