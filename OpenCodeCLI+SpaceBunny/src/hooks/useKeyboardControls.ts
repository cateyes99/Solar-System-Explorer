import { useEffect } from 'react'
import { SPEED_PRESETS, useAppStore } from '../store/useAppStore'
import { SHIP_KEY_CODES } from '../store/shipKeys'
import { spaceAudio } from '../utils/audio'

const DIGIT_TO_BODY: Record<string, string> = {
  '0': 'sun',
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
 * Global keyboard support. Deliberately conservative: shortcuts never fire while
 * the user is typing in a form control, and the spacecraft's flight keys are
 * left to its own listener so both can coexist.
 */
export function useKeyboardControls(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const store = useAppStore.getState()

      // Escape unwinds one layer at a time, and leaving a lesson or scenario also
      // hands the 3D scene back to the orrery.
      if (event.key === 'Escape') {
        if (store.helpVisible) {
          store.setHelpVisible(false)
        } else if (store.factVisible) {
          store.toggleFact()
        } else if (store.tourActive) {
          store.exitTour()
        } else if (store.introVisible) {
          store.dismissIntro()
        } else if (store.panel) {
          store.setPanel(null)
        } else if (store.selectedId) {
          store.select(null)
        } else {
          store.viewSystem()
        }
        event.preventDefault()
        return
      }

      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        store.setHelpVisible(!store.helpVisible)
        event.preventDefault()
        return
      }

      if (store.introVisible) {
        if (event.key === 'Enter' || event.key === ' ') {
          store.dismissIntro()
          event.preventDefault()
        }
        return
      }

      // Flight keys belong to the spacecraft while it is deployed.
      if (store.shipActive && SHIP_KEY_CODES.has(event.code)) return

      const key = event.key.toLowerCase()

      if (DIGIT_TO_BODY[key] && !store.tourActive) {
        const id = DIGIT_TO_BODY[key]
        store.select(id)
        store.focus(id, 'view-planet')
        spaceAudio.play('focus')
        event.preventDefault()
        return
      }

      switch (key) {
        case 'h':
          store.viewSystem()
          spaceAudio.play('whoosh')
          break
        case 'f':
          if (store.selectedId) {
            store.focus(store.selectedId, 'follow')
            spaceAudio.play('focus')
          }
          break
        case 'p':
          store.toggleRunning()
          spaceAudio.play('click')
          break
        case '[':
          store.setSpeedIndex(Math.max(0, store.speedIndex - 1))
          spaceAudio.play('click')
          break
        case ']':
          store.setSpeedIndex(Math.min(SPEED_PRESETS.length - 1, store.speedIndex + 1))
          spaceAudio.play('click')
          break
        case 'l':
          store.toggleLabels()
          break
        case 't':
          if (store.tourActive) store.exitTour()
          else store.startTour()
          spaceAudio.play('whoosh')
          break
        case 'k':
          if (store.panel === 'learn') store.setPanel(null)
          else store.openLesson(store.lessonId ?? 'sun')
          spaceAudio.play('click')
          break
        case 'w':
          store.nextFact()
          spaceAudio.play('chime')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}