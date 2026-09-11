import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulation } from '../../store/simulationStore'
import { getBodyInfo } from '../../data/bodies'

/** Small elegant cursor tooltip shown while hovering a body. */
export function Tooltip(): JSX.Element {
  const hovered = useSimulation((s) => s.hoveredBody)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!hovered) return
    const onMove = (e: PointerEvent): void => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [hovered])

  const info = hovered ? getBodyInfo(hovered) : null

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          key="tooltip"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="glass pointer-events-none fixed z-50 max-w-[240px] rounded-xl px-3 py-2"
          style={{ left: Math.min(pos.x + 16, window.innerWidth - 260), top: pos.y + 18 }}
          role="tooltip"
        >
          <p className="font-display text-sm font-semibold text-white">{info.name}</p>
          <p className="text-xs text-white/60">{info.type}</p>
          <p className="mt-1 text-[11px] text-astro-cyan/90">Click to explore • Double-click to visit</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
