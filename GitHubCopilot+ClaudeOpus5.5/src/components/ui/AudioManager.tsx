import { useEffect } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { audio } from '../../utils/audio'

/** Connects the sound settings and app events to the synthesised audio engine. */
export function AudioManager() {
  const enabled = useSimulationStore((s) => s.sound.enabled)
  const ambient = useSimulationStore((s) => s.sound.ambient)

  useEffect(() => {
    audio.setAmbient(enabled && ambient)
  }, [enabled, ambient])

  useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe((state, prev) => {
      if (!state.sound.enabled) return
      if (state.sound.ui && state.selectedId !== prev.selectedId && state.selectedId) audio.ui('select')
      if (state.sound.ui && state.factOpen && state.factIndex !== prev.factIndex) audio.ui('open')
      if (state.sound.cinematic && state.solarFlareNonce !== prev.solarFlareNonce) audio.cinematic('flare')
    })
    const onClick = (e: MouseEvent) => {
      const { sound } = useSimulationStore.getState()
      if (!sound.enabled || !sound.ui) return
      if (e.target instanceof Element && e.target.closest('button')) audio.ui('tick')
    }
    document.addEventListener('click', onClick)
    return () => {
      unsubscribe()
      document.removeEventListener('click', onClick)
    }
  }, [])

  return null
}
