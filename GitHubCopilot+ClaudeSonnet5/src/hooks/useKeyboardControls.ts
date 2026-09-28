import { useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import type { PlanetId } from '../data/planets'

const NUMBER_KEY_PLANETS: Record<string, PlanetId> = {
  '1': 'mercury',
  '2': 'venus',
  '3': 'earth',
  '4': 'mars',
  '5': 'jupiter',
  '6': 'saturn',
  '7': 'uranus',
  '8': 'neptune',
}

/**
 * Global keyboard shortcuts: 1-8 focus a planet, 0/Escape return to the full
 * system view, Space toggles pause, L toggles planet labels.
 */
export function useKeyboardControls(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      const store = useSimulationStore.getState()
      const planetId = NUMBER_KEY_PLANETS[event.key]
      if (planetId) {
        store.select(planetId)
        return
      }

      switch (event.key) {
        case '0':
        case 'Escape':
          store.resetToSystemView()
          break
        case ' ':
          event.preventDefault()
          store.togglePaused()
          break
        case 'l':
        case 'L':
          store.toggleLabels()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
