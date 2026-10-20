import { useEffect, useState } from 'react'
import { simClock } from '../utils/clock'
import { formatSimDate } from '../utils/astronomy'

/**
 * Polls the (non-React) simulation clock at a gentle rate so the displayed date
 * stays fresh without re-rendering React every frame.
 */
export function useSimulationDate(pollMs = 250): { dateText: string; bump: () => void } {
  const [ms, setMs] = useState(() => simClock.currentMs)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setMs(simClock.currentMs), pollMs)
    return () => window.clearInterval(id)
  }, [pollMs])

  // "bump" lets buttons that jump time refresh the display immediately.
  useEffect(() => {
    setMs(simClock.currentMs)
  }, [tick])

  return { dateText: formatSimDate(ms), bump: () => setTick((t) => t + 1) }
}
