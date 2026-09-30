/**
 * Global input state.
 * Kept outside React so the render loop can read it without re-renders.
 */
export const pressedKeys = new Set<string>()

let bound = false

/** Keys that should not be captured while flying the spacecraft. */
const FLIGHT_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyR',
  'KeyF',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight',
])

export function bindGlobalInput(onShortcut: (action: string) => void): () => void {
  if (bound) return () => undefined
  bound = true

  const isTyping = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null
    if (!el) return false
    const tag = el.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isTyping(event.target)) return
    pressedKeys.add(event.code)

    if (event.code === 'Space' || FLIGHT_KEYS.has(event.code)) {
      // Keep page scroll / button activation under control while exploring
      if (event.code.startsWith('Arrow') || event.code === 'Space') event.preventDefault()
    }

    const key = event.key
    if (key === ' ') onShortcut('pause')
    else if (key === 'Escape') onShortcut('escape')
    else if (key === '?' || (key === '/' && event.shiftKey)) onShortcut('shortcuts')
    else if (key >= '0' && key <= '8') onShortcut(`focus:${key}`)
    else if (key.toLowerCase() === 'l') onShortcut('labels')
    else if (key.toLowerCase() === 'o') onShortcut('orbits')
    else if (key.toLowerCase() === 't') onShortcut('tour')
    else if (key.toLowerCase() === 'f') onShortcut('follow')
    else if (key.toLowerCase() === 'r') onShortcut('fact')
    else if (key.toLowerCase() === 'm') onShortcut('sound')
    else if (key.toLowerCase() === 'c') onShortcut('spacecraft')
    else if (key.toLowerCase() === 'e') onShortcut('learn')
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    pressedKeys.delete(event.code)
  }

  const handleBlur = () => pressedKeys.clear()

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('blur', handleBlur)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    window.removeEventListener('blur', handleBlur)
    bound = false
  }
}
