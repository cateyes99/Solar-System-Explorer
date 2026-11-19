import { useEffect } from 'react'
import { PLANETS, SUN } from '../data/planets'
import { useSimulationStore } from '../store/simulationStore'

export function useKeyboardControls(): void {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.matches('input, textarea, select') ?? false
      if (isTyping) return
      const state = useSimulationStore.getState()
      if (event.key === 'Escape') {
        if (state.activeModal) state.setActiveModal(null)
        else if (state.tourActive) state.exitTour()
        else if (state.missionActive) state.setMissionActive(false)
        else if (state.whatIf) state.setWhatIf(null)
        else state.selectBody(null)
        return
      }
      if (state.activeModal || target?.closest('button')) return
      if (event.code === 'Space') { event.preventDefault(); state.togglePlaying() }
      else if (event.code === 'KeyL') state.toggleLabels()
      else if (event.code === 'KeyO') state.toggleOrbits()
      else if (event.code === 'KeyT') state.startTour()
      else if (event.code === 'KeyF') state.nextFact()
      else if (event.code === 'KeyR') state.viewSystem()
      else if (event.code === 'KeyM') state.setSoundEnabled(!state.soundEnabled)
      else if (event.key === '?' || event.code === 'Slash') state.setActiveModal('shortcuts')
      else if (event.key === '+' || event.key === '=') state.setSpeedIndex(state.speedIndex + 1)
      else if (event.key === '-') state.setSpeedIndex(state.speedIndex - 1)
      else if (/^Digit[0-8]$/.test(event.code)) {
        const index = Number(event.code.replace('Digit', ''))
        const body = index === 0 ? SUN : PLANETS[index - 1]
        state.selectBody(body.id, true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
}
