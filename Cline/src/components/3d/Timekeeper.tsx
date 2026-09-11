import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../../store/simulationStore'
import { SPEEDS, simClock } from '../../utils/clock'

/** Advances the (non-React) simulation clock exactly once per rendered frame. */
export function Timekeeper(): null {
  useFrame((_, delta) => {
    const { paused, speedIndex } = useSimulation.getState()
    if (!paused) simClock.advance(delta * SPEEDS[speedIndex].daysPerSecond)
  })
  return null
}
