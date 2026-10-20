import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { simClock } from '../store/runtime'
import { useSimulationStore } from '../store/simulationStore'

const PUBLISH_INTERVAL = 0.25

/** Advances the simulation clock once per frame and publishes the date to the UI a few times per second. */
export function useSimulationTime(): void {
  const sinceLastPublish = useRef(0)
  useFrame((_, delta) => {
    const { paused, daysPerSecond, publishDays } = useSimulationStore.getState()
    const dt = Math.min(delta, 0.1)
    if (!paused) simClock.days += dt * daysPerSecond
    sinceLastPublish.current += dt
    if (sinceLastPublish.current >= PUBLISH_INTERVAL && !paused) {
      sinceLastPublish.current = 0
      publishDays(simClock.days)
    }
  }, -3)
}
