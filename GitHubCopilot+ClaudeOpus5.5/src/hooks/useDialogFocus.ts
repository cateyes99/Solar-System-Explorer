import { useEffect, useRef } from 'react'

/** Only the most recently opened dialog reacts to Escape. */
const escapeStack: (() => void)[] = []

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || escapeStack.length === 0) return
  e.stopImmediatePropagation()
  escapeStack[escapeStack.length - 1]()
}

export function hasOpenDialog(): boolean {
  return escapeStack.length > 0
}

/** Moves focus into a dialog when it opens, closes it on Escape and restores focus afterwards. */
export function useDialogFocus<T extends HTMLElement>(open: boolean, onClose: () => void, autoFocus = true) {
  const ref = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const frame = autoFocus
      ? requestAnimationFrame(() => {
          const el = ref.current
          if (!el) return
          const focusTarget = el.querySelector<HTMLElement>('[data-autofocus]') ?? el
          focusTarget.focus({ preventScroll: true })
        })
      : 0
    const handler = () => onCloseRef.current()
    escapeStack.push(handler)
    if (escapeStack.length === 1) window.addEventListener('keydown', onKeyDown, true)
    return () => {
      cancelAnimationFrame(frame)
      const index = escapeStack.lastIndexOf(handler)
      if (index >= 0) escapeStack.splice(index, 1)
      if (escapeStack.length === 0) window.removeEventListener('keydown', onKeyDown, true)
      if (autoFocus && previous && document.contains(previous)) previous.focus({ preventScroll: true })
    }
  }, [open, autoFocus])

  return ref
}
