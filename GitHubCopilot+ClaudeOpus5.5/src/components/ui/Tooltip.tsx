import { useEffect, useRef } from 'react'
import { BODIES } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'

/** Small label that follows the mouse while hovering a planet in the 3D view. */
export function Tooltip() {
  const hoveredId = useSimulationStore((s) => s.hoveredId)
  const appMode = useSimulationStore((s) => s.appMode)
  const ref = useRef<HTMLDivElement>(null)
  const pointerType = useRef('mouse')

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerType.current = e.pointerType
      const el = ref.current
      if (!el) return
      el.style.visibility = e.target instanceof HTMLCanvasElement ? 'visible' : 'hidden'
      const x = Math.min(e.clientX + 18, window.innerWidth - el.offsetWidth - 8)
      const y = Math.min(e.clientY + 18, window.innerHeight - el.offsetHeight - 8)
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  const body = hoveredId ? BODIES[hoveredId] : null
  const hint =
    appMode === 'mission'
      ? 'Click to set as destination'
      : appMode === 'tour'
        ? body?.tagline
        : 'Click to learn more · Double-click to fly there'

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-40 transition-opacity duration-150"
      style={{ opacity: body && pointerType.current !== 'touch' ? 1 : 0 }}
      aria-hidden="true"
    >
      {body && (
        <div className="glass rounded-2xl px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: body.color, boxShadow: `0 0 10px ${body.color}` }} />
            <span className="font-display text-[15px] font-bold text-white">{body.name}</span>
            <span className="text-xs text-slate-400">{body.type}</span>
          </div>
          <div className="mt-0.5 text-xs text-slate-300">{hint}</div>
        </div>
      )}
    </div>
  )
}
