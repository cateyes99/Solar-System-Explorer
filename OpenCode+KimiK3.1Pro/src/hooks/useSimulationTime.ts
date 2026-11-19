import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'
import { advanceClock, SPEEDS } from '../utils/simulationClock'

export function SimulationTicker(): null {
  const lastPublish = useRef(0)
  const speedIndex = useSimulationStore((state) => state.speedIndex)
  const isPlaying = useSimulationStore((state) => state.isPlaying)
  const publishSimulationDays = useSimulationStore((state) => state.publishSimulationDays)

  useFrame((_, delta) => {
    if (!isPlaying) return
    const days = advanceClock(delta, SPEEDS[speedIndex].daysPerSecond)
    const now = performance.now()
    // Publishing at 5 Hz keeps the date responsive without re-rendering the scene every frame.
    if (now - lastPublish.current > 200) {
      lastPublish.current = now
      publishSimulationDays(days)
    }
  })
  return null
}
