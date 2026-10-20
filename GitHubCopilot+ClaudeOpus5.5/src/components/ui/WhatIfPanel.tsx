import { useEffect, useState } from 'react'
import { BODIES, PLANET_IDS } from '../../data/planets'
import type { PlanetId } from '../../data/types'
import { WHAT_IFS } from '../../data/whatIf'
import { sunGoneState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { lightTravelSeconds } from '../../utils/astronomy'
import { formatDuration } from '../../utils/format'
import { Icon } from './Icon'
import { Panel } from './Panel'
import { PlanetOrb } from './PlanetOrb'

function SimulationBadge() {
  return (
    <div className="chip bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/30">
      <Icon name="flask" size={14} /> Educational simulation – not a real prediction
    </div>
  )
}

function SunGoneProgress() {
  const [released, setReleased] = useState<PlanetId[]>([])
  useEffect(() => {
    const id = window.setInterval(() => setReleased([...sunGoneState.released.keys()]), 200)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="mt-4 rounded-2xl bg-white/[0.04] p-3">
      <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">When each planet would notice (real time)</h3>
      <ul className="mt-2 space-y-1.5">
        {PLANET_IDS.map((id) => {
          const done = released.includes(id)
          return (
            <li key={id} className="flex items-center gap-2 text-sm">
              <PlanetOrb id={id} size={16} />
              <span className={done ? 'text-white' : 'text-slate-400'}>{BODIES[id].name}</span>
              <span className="ml-auto text-slate-400 tabular-nums">{formatDuration(lightTravelSeconds(BODIES[id].distanceFromSunKm))}</span>
              <span className={`w-16 text-right text-xs font-semibold ${done ? 'text-amber-300' : 'text-slate-500'}`}>{done ? 'Dark!' : 'Waiting'}</span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-400">In the animation the wave is sped up enormously so you don’t have to wait hours.</p>
    </div>
  )
}

export function WhatIfPanel() {
  const appMode = useSimulationStore((s) => s.appMode)
  const infoOpen = useSimulationStore((s) => s.infoOpen)
  const whatIf = useSimulationStore((s) => s.whatIf)
  const startWhatIf = useSimulationStore((s) => s.startWhatIf)
  const setAppMode = useSimulationStore((s) => s.setAppMode)
  const [runId, setRunId] = useState(0)
  const scenario = WHAT_IFS.find((w) => w.id === whatIf)

  return (
    <Panel
      open={appMode === 'whatif' && !infoOpen}
      onClose={() => setAppMode('explore')}
      title={scenario ? scenario.question : 'What If…?'}
      eyebrow={scenario ? 'What If?' : 'Playful experiments'}
      accent="#a78bfa"
      closeLabel="Close What If panel"
    >
      {!scenario && (
        <>
          <p className="text-[15px] leading-relaxed text-slate-300">
            Scientists love asking “what if?”. Pick an experiment and watch the Solar System change. These are{' '}
            <strong className="text-violet-200">pretend simulations</strong> to help you think – not things that will really happen.
          </p>
          <ul className="mt-4 space-y-2">
            {WHAT_IFS.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-violet-300/40 hover:bg-violet-400/10"
                  onClick={() => startWhatIf(w.id)}
                >
                  <span className="font-display block text-lg font-bold text-white">{w.question}</span>
                  <span className="mt-1 block text-sm text-slate-400">{w.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {scenario && (
        <div key={`${scenario.id}-${runId}`}>
          <SimulationBadge />
          <p className="mt-3 text-[15px] leading-relaxed text-slate-200">{scenario.summary}</p>
          {scenario.id === 'no-sun' && <SunGoneProgress />}
          <h3 className="mt-4 text-sm font-bold tracking-wide text-slate-300 uppercase">What would happen?</h3>
          <ul className="mt-2 space-y-2">
            {scenario.points.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-slate-200">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                startWhatIf(scenario.id)
                setRunId((n) => n + 1)
              }}
            >
              <Icon name="shuffle" size={18} /> Run again
            </button>
            <button type="button" className="btn" onClick={() => startWhatIf(null)}>
              <Icon name="chevronLeft" size={18} /> Back to normal
            </button>
          </div>
        </div>
      )}
    </Panel>
  )
}
