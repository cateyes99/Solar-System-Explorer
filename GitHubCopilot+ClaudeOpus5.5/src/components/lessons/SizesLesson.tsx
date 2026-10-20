import { motion } from 'framer-motion'
import { useState } from 'react'
import { BODIES, BODY_IDS, PLANET_IDS } from '../../data/planets'
import type { BodyId } from '../../data/types'
import { useSimulationStore } from '../../store/simulationStore'
import { volumeRatio } from '../../utils/astronomy'
import { formatNumber } from '../../utils/format'
import { PlanetOrb } from '../ui/PlanetOrb'
import { Figure, LessonSection } from './common'

const BIG = 92

function niceCount(n: number): string {
  if (n >= 1e6) return `${formatNumber(n / 1e6, 1)} million`
  if (n >= 1000) return formatNumber(Math.round(n / 100) * 100)
  if (n >= 20) return formatNumber(Math.round(n / 10) * 10)
  return formatNumber(n, n < 2 ? 1 : 0)
}

function Picker({ value, onChange, label }: { value: BodyId; onChange: (id: BodyId) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {BODY_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`btn min-h-10 gap-1.5 px-2.5 text-xs ${value === id ? 'btn-active' : ''}`}
        >
          <PlanetOrb id={id} size={14} /> {BODIES[id].name.replace(/^The /, '')}
        </button>
      ))}
    </div>
  )
}

export default function SizesLesson() {
  const [a, setA] = useState<BodyId>('earth')
  const [b, setB] = useState<BodyId>('jupiter')
  const setScaleMode = useSimulationStore((s) => s.setScaleMode)
  const big = BODIES[a].diameterKm >= BODIES[b].diameterKm ? a : b
  const small = big === a ? b : a
  const ratio = BODIES[big].diameterKm / BODIES[small].diameterKm
  const rBig = Math.min(BIG, 282 / (2 + 2 / ratio))
  const rSmall = Math.max(0.6, rBig / ratio)
  const bigX = 10 + rBig
  const smallX = 10 + 2 * rBig + 18 + rSmall
  const fits = volumeRatio(BODIES[big].diameterKm, BODIES[small].diameterKm)
  const largestPlanet = Math.max(...PLANET_IDS.map((id) => BODIES[id].diameterKm))

  return (
    <div>
      <LessonSection title="Pick two worlds to compare">
        <p className="text-sm text-slate-400">First world</p>
        <Picker value={a} onChange={setA} label="First world" />
        <p className="mt-2 text-sm text-slate-400">Second world</p>
        <Picker value={b} onChange={setB} label="Second world" />
      </LessonSection>

      <Figure caption="Sizes are true to scale with each other in this picture.">
        <svg viewBox="0 0 320 210" className="h-auto w-full" role="img" aria-label={`${BODIES[big].name} compared with ${BODIES[small].name}`}>
          <defs>
            <radialGradient id="cmp-big" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="40%" stopColor={BODIES[big].color} />
              <stop offset="100%" stopColor="#05070f" />
            </radialGradient>
            <radialGradient id="cmp-small" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="40%" stopColor={BODIES[small].color} />
              <stop offset="100%" stopColor="#05070f" />
            </radialGradient>
          </defs>
          <motion.circle cy={105} fill="url(#cmp-big)" initial={false} animate={{ r: rBig, cx: bigX }} transition={{ type: 'spring', damping: 18 }} />
          <motion.circle
            cy={105}
            fill="url(#cmp-small)"
            initial={false}
            animate={{ r: rSmall, cx: smallX }}
            transition={{ type: 'spring', damping: 18 }}
          />
          <text x={bigX} y={202} textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="600">
            {BODIES[big].name.replace(/^The /, '')}
          </text>
          <text x={Math.min(290, smallX)} y={105 - rSmall - 8} textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="600">
            {BODIES[small].name.replace(/^The /, '')}
          </text>
        </svg>
      </Figure>

      <div className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-4 text-[15px] leading-relaxed text-amber-50" aria-live="polite">
        {a === b ? (
          <>Pick two different worlds to compare them!</>
        ) : (
          <>
            <strong>{BODIES[big].name}</strong> is about <strong>{formatNumber(ratio, ratio < 10 ? 1 : 0)} times</strong> wider than{' '}
            {BODIES[small].name.replace(/^The /, 'the ')}. You could fit about <strong>{niceCount(fits)}</strong>{' '}
            {BODIES[small].name.replace(/^The /, '')}
            {fits >= 2 ? 's' : ''} inside it!
          </>
        )}
      </div>

      <LessonSection title="All eight planets in a line">
        <div className="flex items-end gap-1.5 overflow-x-auto pb-2" role="img" aria-label="The eight planets drawn to scale next to each other">
          {PLANET_IDS.map((id) => {
            const size = Math.max(3, (BODIES[id].diameterKm / largestPlanet) * 120)
            return (
              <div key={id} className="flex shrink-0 flex-col items-center gap-1">
                <PlanetOrb id={id} size={size} />
                <span className="text-[10px] text-slate-400">{BODIES[id].name}</span>
              </div>
            )
          })}
        </div>
        <button type="button" className="btn mt-2" onClick={() => setScaleMode('relative')}>
          Show true sizes in 3D
        </button>
      </LessonSection>
    </div>
  )
}
