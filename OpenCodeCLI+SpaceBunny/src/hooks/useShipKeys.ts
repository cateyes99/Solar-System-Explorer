import { useEffect } from 'react'
import { SHIP_KEY_CODES } from '../store/shipKeys'

/**
 * Live flight-key state. Kept outside React so the spacecraft can poll it every
 * frame without triggering a single re-render.
 */
const held = new Set<string>()

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true
}

/** Subscribes to the flight keys while the probe is deployed. */
export function useShipKeys(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const down = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (!SHIP_KEY_CODES.has(event.code)) return
      held.add(event.code)
      // Stop the page from scrolling when arrow keys fly the probe.
      event.preventDefault()
    }

    const up = (event: KeyboardEvent) => held.delete(event.code)
    const blur = () => held.clear()

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      held.clear()
    }
  }, [enabled])
}

/** True while the given flight key is held down. */
export function isFlightKeyDown(code: string): boolean {
  return held.has(code)
}