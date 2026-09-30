import { useEffect } from 'react'
import { useSimStore } from '../store/simulationStore'
import { setSimSpeed, simDateMs } from '../utils/simClock'

/**
 * Keeps the plain-object simulation clock in sync with store changes and
 * feeds a throttled date back to the UI (never every frame).
 */
export function useSimulationTime(): void {
  useEffect(() => {
    const unsubscribe = useSimStore.subscribe((state, previous) => {
      if (
        state.speedPreset !== previous.speedPreset ||
        state.paused !== previous.paused
      ) {
        const preset = state.speedPreset
        const paused = state.paused
        const daysPerSecond = paused
          ? 0
          : ({ slow: 0.05, normal: 1, fast: 30, veryFast: 365, epic: 3650 } as const)[
              preset === 'paused' ? 'normal' : preset
            ] ?? 1
        setSimSpeed(daysPerSecond, daysPerSecond === 0)
      }
    })

    const id = window.setInterval(() => {
      const state = useSimStore.getState()
      const now = simDateMs()
      if (Math.abs(now - state.simDateMs) > 500) state.setSimDate(now)
    }, 250)

    return () => {
      unsubscribe()
      window.clearInterval(id)
    }
  }, [])
}
