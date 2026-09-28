import { useEffect, useState } from 'react'
import { useSimulationStore } from '../../../store/simulationStore'
import { computeMoonPhase, MOON_PHASES } from '../../../utils/astronomy'
import { MOON } from '../../../data/planets'

interface MoonPhaseIconProps {
  illumination: number
  waxing: boolean
  active: boolean
}

/** Classic "two overlapping circles" CSS technique for a lunar phase glyph. */
function MoonPhaseIcon({ illumination, waxing, active }: MoonPhaseIconProps) {
  const offset = waxing ? (1 - illumination) * 100 : -(1 - illumination) * 100
  return (
    <div
      className={`relative h-8 w-8 overflow-hidden rounded-full bg-[#242a45] ${
        active ? 'ring-2 ring-electric-blue' : 'ring-1 ring-white/10'
      }`}
    >
      <div className="absolute inset-0 rounded-full bg-[#e8e4d8]" style={{ transform: `translateX(${offset}%)` }} />
    </div>
  )
}

/** Live-updating tracker showing the Moon's current phase, driven by real simulated time. */
export function MoonPhaseTracker() {
  const [days, setDays] = useState(() => useSimulationStore.getState().simTimeDays)

  useEffect(() => {
    const interval = setInterval(() => setDays(useSimulationStore.getState().simTimeDays), 300)
    return () => clearInterval(interval)
  }, [])

  const phase = computeMoonPhase(days, MOON.orbitalPeriodDays)
  const currentIndex = MOON_PHASES.findIndex((p) => p.name === phase.name)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2.5">
        {MOON_PHASES.map((p, i) => (
          <div key={`${p.name}-${i}`} className="flex flex-col items-center gap-1">
            <MoonPhaseIcon illumination={p.illumination} waxing={i <= 4} active={i === currentIndex} />
            <span className="max-w-[4.2rem] text-center text-[9px] leading-tight text-white/50">{p.name}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-white/80">
        Right now, the Moon is in its <span className="font-semibold text-white">{phase.name}</span> phase.
      </p>
    </div>
  )
}
