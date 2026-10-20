import { useEffect, useRef } from 'react'
import { BODIES, PLANET_IDS } from '../../data/planets'
import type { PlanetId } from '../../data/types'
import { simClock } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { meanLongitude } from '../../utils/astronomy'

const SIZE = 460
const C = SIZE / 2

function orbitRadius(id: PlanetId): number {
  return 34 + Math.sqrt(BODIES[id].orbit?.semiMajorAxisAU ?? 1) * 34
}

function dotRadius(id: PlanetId): number {
  return 3 + Math.sqrt(BODIES[id].diameterKm / 12_756) * 2.6
}

/** Simplified animated 2D Solar System for browsers without WebGL. */
export function Fallback2D({ reason }: { reason: string }) {
  const refs = useRef<Partial<Record<PlanetId, SVGGElement | null>>>({})
  const select = useSimulationStore((s) => s.select)
  const selectedId = useSimulationStore((s) => s.selectedId)

  useEffect(() => {
    useSimulationStore.getState().setSceneReady()
    let frame = 0
    let last = performance.now()
    let publish = 0
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const s = useSimulationStore.getState()
      if (!s.paused) simClock.days += dt * s.daysPerSecond
      publish += dt
      if (publish > 0.25) {
        publish = 0
        s.publishDays(simClock.days)
      }
      for (const id of PLANET_IDS) {
        const g = refs.current[id]
        if (!g) continue
        const angle = meanLongitude(BODIES[id], simClock.days)
        const r = orbitRadius(id)
        g.setAttribute('transform', `translate(${(C + Math.cos(angle) * r).toFixed(1)} ${(C - Math.sin(angle) * r).toFixed(1)})`)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="absolute inset-0 overflow-auto bg-[radial-gradient(ellipse_at_center,#0b1430_0%,#02030a_70%)] pt-24 pb-36">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="glass mx-auto max-w-xl rounded-3xl p-5" role="alert">
          <h2 className="font-display text-xl font-bold text-white">Your browser or graphics hardware cannot display the 3D Solar System.</h2>
          <p className="mt-2 text-sm text-slate-300">
            Here is a simpler 2D version instead – you can still click the planets to learn about them. To see the full 3D experience, try
            a different browser or turn on hardware acceleration in your browser settings.
          </p>
          <p className="mt-2 text-xs text-slate-500">Details: {reason}</p>
        </div>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto mt-6 h-auto w-full max-w-[560px]" role="group" aria-label="Simplified 2D Solar System">
          <defs>
            <radialGradient id="fb-sun">
              <stop offset="0%" stopColor="#fff4c2" />
              <stop offset="55%" stopColor="#ffb347" />
              <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
          </defs>
          {PLANET_IDS.map((id) => (
            <circle key={id} cx={C} cy={C} r={orbitRadius(id)} fill="none" stroke="rgba(148,170,255,0.18)" />
          ))}
          <g role="button" tabIndex={0} aria-label="The Sun" onClick={() => select('sun')} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && select('sun')} className="cursor-pointer">
            <circle cx={C} cy={C} r={30} fill="url(#fb-sun)" />
            <circle cx={C} cy={C} r={15} fill="#ffc14d" />
          </g>
          {PLANET_IDS.map((id) => (
            <g
              key={id}
              ref={(el) => {
                refs.current[id] = el
              }}
              role="button"
              tabIndex={0}
              aria-label={BODIES[id].name}
              aria-pressed={selectedId === id}
              onClick={() => select(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  select(id)
                }
              }}
              className="cursor-pointer"
            >
              <circle r={dotRadius(id) + 7} fill="transparent" />
              {id === 'saturn' && <ellipse rx={dotRadius(id) * 1.9} ry={dotRadius(id) * 0.6} fill="none" stroke="#e3cf98" strokeOpacity={0.8} />}
              <circle r={dotRadius(id)} fill={BODIES[id].color} stroke={selectedId === id ? '#fff' : 'none'} strokeWidth={2} />
              <text y={-dotRadius(id) - 5} textAnchor="middle" fontSize="10" fill="#cbd5e1">
                {BODIES[id].name}
              </text>
            </g>
          ))}
        </svg>
        <p className="mt-2 text-xs text-slate-500">Not to scale. Orbits are simplified circles.</p>
      </div>
    </div>
  )
}
