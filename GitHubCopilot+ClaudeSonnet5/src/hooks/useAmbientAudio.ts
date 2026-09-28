import { useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { setAmbientEnabled } from '../utils/audio'

/** Starts/stops the procedural ambient drone whenever soundEnabled changes. */
export function useAmbientAudio(): void {
  const soundEnabled = useSimulationStore((s) => s.soundEnabled)

  useEffect(() => {
    setAmbientEnabled(soundEnabled)
  }, [soundEnabled])
}
