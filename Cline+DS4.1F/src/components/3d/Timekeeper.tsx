import { useFrame } from '@react-three/fiber'
import { clock } from '../../utils/simulationClock'
import { simulationDaysPerSecond, useSimulationStore } from '../../store/simulationStore'

/** Longest real-time step, in seconds, that a single frame is allowed to advance. */
const MAX_STEP_SECONDS = 0.25

/**
 * The one place where simulated time actually moves.
 *
 * `clock` is a plain mutable singleton living outside React, so something has to
 * push it forward once per rendered frame — that is this component's entire job.
 * Every other body (planets, moons, the comet) *derives* its position from the
 * clock, so without this component the whole Solar System stands still.
 *
 * The speed and the pause flag are read with `getState()` rather than through a
 * subscription: the render loop then sees a speed change on the very next frame
 * without re-rendering React, which is the same trick the rest of the scene uses
 * for per-frame state.
 */
export function Timekeeper(): null {
  useFrame((_, delta) => {
    const state = useSimulationStore.getState()
    // One enormous step (a background tab waking up, a long stall) would
    // teleport the planets, so the real-time step is capped for stability. The
    // clock applies its own, separate cap to how far a body may spin per frame.
    const step = Math.min(delta, MAX_STEP_SECONDS)
    clock.advance(step, simulationDaysPerSecond(state), state.paused)
  })

  return null
}
