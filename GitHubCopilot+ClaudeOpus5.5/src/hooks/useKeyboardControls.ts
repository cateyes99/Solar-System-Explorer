import { useEffect } from 'react'
import { BODY_IDS } from '../data/planets'
import { flightInput } from '../store/runtime'
import { useSimulationStore } from '../store/simulationStore'
import { hasOpenDialog } from './useDialogFocus'

const FLIGHT_KEYS: Record<string, keyof typeof flightInput> = {
  KeyW: 'forward',
  KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Global keyboard shortcuts plus spacecraft flight keys. */
export function useKeyboardControls(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
      const s = useSimulationStore.getState()

      if (s.appMode === 'mission' && FLIGHT_KEYS[e.code]) {
        flightInput[FLIGHT_KEYS[e.code]] = true
        if (e.code.startsWith('Arrow')) e.preventDefault()
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        const id = BODY_IDS[Number(e.key)]
        if (!id) return
        if (s.appMode === 'mission') s.setDestination(id)
        else if (s.appMode !== 'tour') {
          s.viewBody(id)
          s.select(id)
        }
        return
      }

      switch (e.key) {
        case ' ':
          if (e.target instanceof HTMLButtonElement) return
          e.preventDefault()
          s.togglePause()
          break
        case 'h':
        case 'H':
          if (s.appMode !== 'mission' && s.appMode !== 'tour') s.viewSystem()
          break
        case 'f':
        case 'F':
          if (s.selectedId && s.appMode !== 'mission' && s.appMode !== 'tour') s.followBody(s.selectedId)
          break
        case 'l':
        case 'L':
          s.toggleLabels()
          break
        case 'o':
        case 'O':
          s.toggleOrbits()
          break
        case '+':
        case '=':
          s.stepSpeed(1)
          break
        case '-':
        case '_':
          s.stepSpeed(-1)
          break
        case 't':
        case 'T':
          s.showFact()
          break
        case 'm':
        case 'M':
          s.setSound({ enabled: !s.sound.enabled })
          break
        case 'c':
        case 'C':
          if (s.appMode === 'tour') s.exitTour()
          else s.startTour()
          break
        case '?':
          s.setHelpOpen(true)
          break
        case 'Escape':
          if (hasOpenDialog()) return
          if (s.appMode === 'tour') s.exitTour()
          else if (s.infoOpen) s.closeInfo()
          else if (s.appMode === 'mission') s.setAppMode('explore')
          else s.viewSystem()
          break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = FLIGHT_KEYS[e.code]
      if (key) flightInput[key] = false
    }
    const onBlur = () => {
      for (const key of Object.keys(flightInput) as (keyof typeof flightInput)[]) flightInput[key] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}
