import { useEffect } from 'react'
import { useSimulation } from '../store/simulationStore'

/** Shared flight-key state, read by the spacecraft each frame (never triggers renders). */
export const flightKeys = {
  forward: false,
  back: false,
  yawLeft: false,
  yawRight: false,
  pitchUp: false,
  pitchDown: false,
  rollLeft: false,
  rollRight: false,
  boost: false,
}
export type FlightKey = keyof typeof flightKeys

const FLIGHT_KEY_MAP: Record<string, FlightKey> = {
  KeyW: 'forward',
  KeyS: 'back',
  ArrowUp: 'pitchUp',
  ArrowDown: 'pitchDown',
  KeyA: 'yawLeft',
  KeyD: 'yawRight',
  KeyQ: 'rollLeft',
  KeyE: 'rollRight',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

/** Global keyboard shortcuts + flight-key capture for the spacecraft mode. */
export function useAppKeyboard(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const flight = FLIGHT_KEY_MAP[e.code]
      if (flight) {
        flightKeys[flight] = true
        if (useSimulation.getState().focus.mode === 'spacecraft') e.preventDefault()
        return
      }
      const store = useSimulation.getState()
      switch (e.code) {
        case 'Space':
          if (store.tourActive) store.setTourPaused(!store.tourPaused)
          else store.togglePaused()
          e.preventDefault()
          break
        case 'Escape':
          if (store.tourActive) store.stopTour()
          else if (store.panel !== 'none') store.setPanel('none')
          else if (store.lessonId) store.openLesson(null)
          else if (store.selectedBody) store.focusSystem()
          break
        case 'KeyL':
          store.toggle('showLabels')
          break
        case 'KeyO':
          store.toggle('showOrbits')
          break
        case 'KeyR':
          store.surpriseCamera()
          break
        case 'KeyF':
          store.focusSystem()
          break
        default:
          break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const flight = FLIGHT_KEY_MAP[e.code]
      if (flight) flightKeys[flight] = false
    }
    const onBlur = () => {
      ;(Object.keys(flightKeys) as FlightKey[]).forEach((k) => {
        flightKeys[k] = false
      })
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
