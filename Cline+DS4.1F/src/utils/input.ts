/**
 * Keyboard state for the spacecraft and the global shortcuts.
 *
 * Held keys are kept in a plain Set (no React state) and read inside `useFrame`
 * so that holding a key down never triggers a re-render.
 */
class KeyboardInput {
  private readonly held = new Set<string>()
  private attached = false

  private readonly onKeyDown = (event: KeyboardEvent) => {
    // Never swallow typing inside inputs, sliders or buttons.
    const target = event.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return
    }
    this.held.add(event.code)
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.held.delete(event.code)
  }

  private readonly onBlur = () => {
    this.held.clear()
  }

  attach(): void {
    if (this.attached || typeof window === 'undefined') return
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    this.attached = true
  }

  detach(): void {
    if (!this.attached || typeof window === 'undefined') return
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.held.clear()
    this.attached = false
  }

  isDown(code: string): boolean {
    return this.held.has(code)
  }

  anyDown(codes: string[]): boolean {
    return codes.some((code) => this.held.has(code))
  }

  clear(): void {
    this.held.clear()
  }
}

export const keyboard = new KeyboardInput()