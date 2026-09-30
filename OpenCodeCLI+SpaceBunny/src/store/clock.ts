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

/**
 * Soft ceiling for axial rotation, in turns per real second (≈18°/s, i.e. one
 * full turn every 20 seconds).
 *
 * True rotation rates span three orders of magnitude — Mercury takes 59 days to
 * turn once, Jupiter ten hours — and at every speed preset the fastest bodies
 * smear into an unreadable blur. Scaling all bodies by one fixed factor would
 * only trade that for a frozen Mercury, so each body's rate is clipped
 * *individually* towards this ceiling: a body already turning slower than the
 * ceiling keeps its true rate, and a faster one is bent towards the ceiling
 * asymptotically. Direction is preserved, so Venus still spins backwards, and
 * the ordering Jupiter-faster-than-Earth-faster-than-Mercury always holds.
 *
 * Tuned against the presets: Earth takes ~20s per turn at Slow and ~4s at
 * Normal, while the fast presets are still free to blur.
 */
const SPIN_CEILING_TURNS_PER_SECOND = 0.05

/**
 * Linear term added on top of the clipped rate, so the fast presets still *look*
 * fast instead of all collapsing onto the same ceiling.
 */
const SPIN_ESCAPE = 0.01

/**
 * Compress one body's unclipped rotation rate (turns per real second) into
 * something watchable. Sign-preserving, so retrograde bodies stay retrograde.
 */
function clipSpinRate(turnsPerSecond: number): number {
  const sign = Math.sign(turnsPerSecond)
  const rate = Math.abs(turnsPerSecond)
  if (rate === 0) return 0
  const ceiling = SPIN_CEILING_TURNS_PER_SECOND
  return sign * ((ceiling * rate) / (rate + ceiling) + rate * SPIN_ESCAPE)
}

interface SpinState {
  /** Cumulative turns, signed and unwrapped. */
  turns: number
  /** True sidereal rotation period in hours; negative means retrograde. */
  periodHours: number
}

class SimulationClock {
  /** Simulated days since {@link EPOCH_MS}. */
  simDays = 0
  running = true
  /** Simulated days per real second. */
  daysPerSecond = 20
  /**
   * Accumulated axial rotation per body, keyed by body id. Integrated frame by
   * frame at each body's own clipped rate, which is what keeps every surface
   * legible while leaving slow rotators untouched.
   */
  private spins = new Map<string, SpinState>()
  private lastMs = 0
  /** Real seconds elapsed in the most recent {@link tick}. */
  private lastDeltaSeconds = 0

  /** Call once per frame. Returns the current simulated day count. */
  tick(nowMs: number): number {
    if (this.lastMs === 0) {
      this.lastMs = nowMs
      this.lastDeltaSeconds = 0
      return this.simDays
    }
    if (this.running) {
      const dt = Math.min((nowMs - this.lastMs) / 1000, MAX_FRAME_SECONDS)
      this.lastDeltaSeconds = dt
      this.simDays += dt * this.daysPerSecond
    } else {
      this.lastDeltaSeconds = 0
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
    // Keep axial rotation in step with the date, so jumping the clock a season
    // also turns the planets rather than leaving the continents as they were.
    for (const state of this.spins.values()) {
      const trueRate = (this.daysPerSecond * 24) / state.periodHours
      const realSeconds = days / this.daysPerSecond
      state.turns += clipSpinRate(trueRate) * realSeconds
    }
  }

  /** Fractional orbit angle for a body, in radians. */
  angle(periodDays: number, phase = 0): number {
    const turns = this.simDays / periodDays + phase / (Math.PI * 2)
    return (turns * Math.PI * 2) % (Math.PI * 2)
  }

  /**
   * How far a body has rotated on its axis, in radians, integrating this frame's
   * elapsed time at the body's own clipped rate.
   *
   * `rateScale` further damps the body without touching its accumulated angle, so
   * it can be changed at any time (reduced motion) without the surface jumping.
   * Call once per body per frame, after {@link tick}.
   */
  spin(id: string, rotationPeriodHours: number, rateScale = 1): number {
    let state = this.spins.get(id)
    if (!state || state.periodHours !== rotationPeriodHours) {
      state = { turns: 0, periodHours: rotationPeriodHours }
      this.spins.set(id, state)
    }
    if (this.lastDeltaSeconds > 0) {
      // True turns per real second: simulated hours advanced / rotation period.
      const trueRate = (this.daysPerSecond * 24) / state.periodHours
      state.turns += this.lastDeltaSeconds * clipSpinRate(trueRate) * rateScale
    }
    return (state.turns % 1) * Math.PI * 2
  }

  /** Fractional spin, in turns, for callers that need a drift term. */
  spinTurns(id: string): number {
    return this.spins.get(id)?.turns ?? 0
  }

  get simulatedMs(): number {
    return EPOCH_MS + this.simDays * MS_PER_DAY
  }
}

export const simClock = new SimulationClock()

export { MS_PER_DAY }