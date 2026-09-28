import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../store/simulationStore'

/**
 * Advances simulated time every frame outside of React's render cycle.
 * Mount once inside the <Canvas> tree (see SolarSystemScene).
 */
export function useSimulationTime(): void {
  useFrame((_, delta) => {
    // Clamp delta so a dropped-frame / tab-switch spike can't cause a huge time jump.
    useSimulationStore.getState().tick(Math.min(delta, 0.25))
  })
}
