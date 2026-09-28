import { useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { keyboard } from '../utils/input'
import { TIME_SPEEDS } from '../data/missions'

/**
 * Global keyboard shortcuts.
 *
 * Everything is also reachable with the mouse or a finger, but a child with a
 * keyboard can drive the whole experience: space pauses, the number keys change
 * speed, and the letter keys toggle the layers and panels.
 */
export function useKeyboardControls(): void {
  useEffect(() => {
    keyboard.attach()

    const isTyping = (target: EventTarget | null): boolean => {
      const element = target as HTMLElement | null
      if (!element) return false
      return (
        element.tagName === 'INPUT' ||
        element.tagName === 'TEXTAREA' ||
        element.tagName === 'SELECT' ||
        element.isContentEditable
      )
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      const store = useSimulationStore.getState()

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          store.togglePaused()
          break
        case 'ArrowRight':
          event.preventDefault()
          store.nudgeDays(1)
          break
        case 'ArrowLeft':
          event.preventDefault()
          store.nudgeDays(-1)
          break
        case 'Escape': {
          if (store.cinematic.active) store.exitTour()
          else if (store.missionActive) store.endMission()
          else if (store.ui.educationOpen) store.closeEducation()
          else if (store.ui.whatIfOpen) store.toggleWhatIf(false)
          else if (store.ui.factCardOpen) store.closeFactCard()
          else if (store.ui.settingsOpen) store.openSettings(false)
          else store.selectBody(null)
          break
        }
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6': {
          const index = Number(event.code.replace('Digit', '')) - 1
          if (TIME_SPEEDS[index]) store.setSpeedIndex(index)
          break
        }
        case 'KeyL':
          store.toggleLabels()
          break
        case 'KeyO':
          store.toggleOrbits()
          break
        case 'KeyB':
          store.toggleAsteroidBelt()
          break
        case 'KeyN':
          store.toggleNebula()
          break
        case 'KeyR':
          store.resetView()
          break
        case 'KeyT':
          if (store.cinematic.active) store.exitTour()
          else store.startTour()
          break
        case 'KeyE':
          if (store.ui.educationOpen) store.closeEducation()
          else store.openEducation(null)
          break
        case 'KeyI':
          store.toggleWhatIf()
          break
        case 'KeyF':
          store.teachMeSomething()
          break
        case 'KeyM':
          store.setSoundEnabled(!store.soundEnabled)
          break
        case 'KeyS':
          store.openSettings()
          break
        case 'KeyH':
          store.toggleHelp()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      keyboard.detach()
    }
  }, [])
}