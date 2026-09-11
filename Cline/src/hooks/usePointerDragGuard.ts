import { useRef } from 'react'

/**
 * Distinguishes real clicks from OrbitControls drags: returns pointer handlers
 * that suppress onClick when the pointer moved more than a few pixels.
 */
export function useClickWithoutDrag(thresholdPx = 7): {
  onPointerDown: (e: { clientX: number; clientY: number }) => void
  wasClick: (e: { clientX: number; clientY: number }) => boolean
} {
  const down = useRef<{ x: number; y: number } | null>(null)
  return {
    onPointerDown: (e) => {
      down.current = { x: e.clientX, y: e.clientY }
    },
    wasClick: (e) => {
      const d = down.current
      down.current = null
      if (!d) return true
      return Math.hypot(e.clientX - d.x, e.clientY - d.y) < thresholdPx
    },
  }
}
