import { useEffect, useState } from 'react'
import { clock } from '../utils/simulationClock'
import { daysSinceJ2000 } from '../utils/astronomy'

export interface SimulationTime {
  /** Simulated UTC time, as a Date. */
  date: Date
  timeMs: number
  daysSinceJ2000: number
}

/**
 * Samples the simulation clock for the interface.
 *
 * The clock itself advances every rendered frame, but the HUD only needs to know
 * the date a few times a second — polling keeps React out of the render loop.
 */
export function useSimulationTime(intervalMs = 250): SimulationTime {
  const [timeMs, setTimeMs] = useState(() => clock.time)

  useEffect(() => {
    const id = window.setInterval(() => setTimeMs(clock.time), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return { date: new Date(timeMs), timeMs, daysSinceJ2000: daysSinceJ2000(timeMs) }
}