import { useEffect } from 'react'
import { setAmbientAudio } from '../audio/ambientAudio'
import { useSimulationStore } from '../store/simulationStore'

export function useAmbientAudio(): void {
  const soundEnabled = useSimulationStore((state) => state.soundEnabled)
  const showToast = useSimulationStore((state) => state.showToast)

  useEffect(() => {
    setAmbientAudio(soundEnabled).catch(() => {
      useSimulationStore.getState().setSoundEnabled(false)
      showToast('Audio is unavailable in this browser. The Solar System is still ready to explore.')
    })
  }, [soundEnabled, showToast])
}
