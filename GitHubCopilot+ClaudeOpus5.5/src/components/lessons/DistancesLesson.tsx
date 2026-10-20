import { useEffect, useRef, useState } from 'react'
import { AU_KM, BODIES, PLANET_IDS } from '../../data/planets'
import type { PlanetId } from '../../data/types'
import { useSimulationStore } from '../../store/simulationStore'
import { SPEED_OF_LIGHT_KM_S } from '../../utils/astronomy'
import { formatDuration, formatKm } from '../../utils/format'
import { PlanetOrb } from '../ui/PlanetOrb'
import { Figure, LessonSection, PlayButton } from './common'

const TRAVEL_MODES = [
  { id: 'light', label: 'Light', kmPerHour: SPEED_OF_LIGHT_KM_S * 3600, note: 'the fastest thing in the Universe' },
  { id: 'probe', label: 'Fast spacecraft', kmPerHour: 58_000, note: 'about as fast as the New Horizons probe when it launched' },
  { id: 'plane', label: 'Jet plane', kmPerHour: 900, note: 'a passenger jet' },
  { id: 'car', label: 'Car', kmPerHour: 100, note: 'driving on a motorway, never stopping' },
] as const

type TravelId = (typeof TRAVEL_MODES)[number]['id']

const MAX_AU = 30.07
/** Seconds for the animated light beam to cross to Neptune. */
const BEAM_SECONDS = 14

export default function DistancesLesson() {
  const [mode, setMode] = useState<TravelId>('light')
  const [focus, setFocus] = useState<PlanetId>('neptune')
  const [playing, setPlaying] = useState(true)
  const beamRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLElement>(null)
  const beamAU = useRef(0)
  const setScaleMode = useSimulationStore((s) => s.setScaleMode)
  const travel = TRAVEL_MODES.find((m) => m.id === mode) ?? TRAVEL_MODES[0]

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      let au = beamAU.current + ((now - last) / 1000) * (MAX_AU / BEAM_SECONDS)
      last = now
      if (au > MAX_AU * 1.05) au = 0
      beamAU.current = au
      if (beamRef.current) beamRef.current.style.width = `${Math.min(100, (au / MAX_AU) * 100)}%`
      if (readoutRef.current) readoutRef.current.textContent = formatDuration((Math.min(au, MAX_AU) * AU_KM) / SPEED_OF_LIGHT_KM_S)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  return (
    <div>
      <LessonSection title="Space is mostly… space!">
        <p>
          On this line the distances are <strong className="text-indigo-200">truly to scale</strong>. Look how close the first four
          planets are – and how far away the giants are!
        </p>
      </LessonSection>

      <Figure>
        <div className="relative h-24" role="group" aria-label="Planets placed at their real distances from the Sun">
          <div className="absolute top-1/2 right-0 left-0 h-px bg-white/15" />
          <div ref={beamRef} className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-200/0 via-amber-200/70 to-yellow-100 shadow-[0_0_14px_rgba(253,230,138,0.8)]" style={{ width: 0 }} />
          <span className="absolute top-1/2 left-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(255,190,80,0.9)]" aria-hidden="true" />
          {PLANET_IDS.map((id, i) => {
            const au = BODIES[id].orbit?.semiMajorAxisAU ?? 0
            const left = (au / MAX_AU) * 100
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFocus(id)}
                aria-pressed={focus === id}
                aria-label={`${BODIES[id].name}, ${au} AU from the Sun`}
                className={`absolute top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full p-1 ${focus === id ? 'ring-2 ring-cyan-300' : ''}`}
                style={{ left: `${Math.max(2, left)}%`, marginTop: i % 2 === 0 ? -22 : 22 }}
              >
                <PlanetOrb id={id} size={i >= 4 ? 16 : 10} />
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} label="light beam" />
          <p className="text-sm text-slate-300" aria-live="off">
            The light beam has travelled for <strong ref={readoutRef} className="text-amber-200">0 seconds</strong>
            <span className="text-slate-500"> (sped up!)</span>
          </p>
        </div>
      </Figure>

      <LessonSection title="How long would the trip take?">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Travel by">
          {TRAVEL_MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`btn min-h-10 px-3 text-xs ${mode === m.id ? 'btn-active' : ''}`} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">Travelling at {travel.note}.</p>
        <table className="mt-1 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase">
              <th className="py-1 font-semibold">Planet</th>
              <th className="py-1 font-semibold">Distance</th>
              <th className="py-1 text-right font-semibold">Trip from the Sun</th>
            </tr>
          </thead>
          <tbody>
            {PLANET_IDS.map((id) => {
              const km = BODIES[id].distanceFromSunKm
              const seconds = (km / travel.kmPerHour) * 3600
              return (
                <tr key={id} className={`border-t border-white/8 ${focus === id ? 'bg-cyan-400/10' : ''}`}>
                  <td className="py-1.5">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <PlanetOrb id={id} size={12} /> {BODIES[id].name}
                    </span>
                  </td>
                  <td className="py-1.5 text-slate-300">{formatKm(km)}</td>
                  <td className="py-1.5 text-right font-semibold text-amber-200 tabular-nums">{formatDuration(seconds)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button type="button" className="btn mt-2" onClick={() => setScaleMode('distance')}>
          Show true distances in 3D
        </button>
      </LessonSection>
    </div>
  )
}
