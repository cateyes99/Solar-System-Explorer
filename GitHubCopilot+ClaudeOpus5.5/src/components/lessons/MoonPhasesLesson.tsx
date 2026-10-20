import { useEffect, useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { SYNODIC_MONTH_DAYS, moonPhase, phaseName } from '../../utils/astronomy'
import { formatNumber } from '../../utils/format'
import { Figure, LessonSection, ModelBadge, PlayButton } from './common'

const KEY_PHASES = [
  { name: 'New Moon', phase: 0 },
  { name: 'Crescent', phase: 0.125 },
  { name: 'First Quarter', phase: 0.25 },
  { name: 'Gibbous', phase: 0.375 },
  { name: 'Full Moon', phase: 0.5 },
]

/** SVG path of the sunlit part of the Moon as seen from Earth (northern hemisphere view). */
function litPath(phase: number, cx: number, cy: number, r: number): string {
  const p = ((phase % 1) + 1) % 1
  const rx = Math.abs(Math.cos(p * Math.PI * 2)) * r
  const waxing = p <= 0.5
  const top = `${cx} ${cy - r}`
  const bottom = `${cx} ${cy + r}`
  if (waxing) {
    const crescent = p < 0.25
    return `M${top} A${r} ${r} 0 0 1 ${bottom} A${rx} ${r} 0 0 ${crescent ? 0 : 1} ${top}Z`
  }
  const gibbous = p < 0.75
  return `M${top} A${r} ${r} 0 0 0 ${bottom} A${rx} ${r} 0 0 ${gibbous ? 0 : 1} ${top}Z`
}

function MoonView({ phase, r = 56, decorative = false }: { phase: number; r?: number; decorative?: boolean }) {
  const size = r * 2 + 8
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full max-w-[150px]"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `The Moon as seen from Earth: ${phaseName(phase)}`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="#1e293b" />
      <path d={litPath(phase, size / 2, size / 2, r)} fill="#e5e7eb" />
      <circle cx={size / 2 - r * 0.3} cy={size / 2 - r * 0.2} r={r * 0.16} fill="#000" opacity={0.08} />
      <circle cx={size / 2 + r * 0.25} cy={size / 2 + r * 0.3} r={r * 0.22} fill="#000" opacity={0.07} />
    </svg>
  )
}

function OrbitView({ phase }: { phase: number }) {
  const cx = 110
  const cy = 100
  const orbit = 70
  const theta = Math.PI - phase * Math.PI * 2
  const mx = cx + Math.cos(theta) * orbit
  const my = cy + Math.sin(theta) * orbit
  return (
    <svg viewBox="0 0 220 200" className="h-auto w-full" role="img" aria-label="View from above: the Moon travelling around Earth, lit from the left by the Sun">
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1={4} y1={y} x2={26} y2={y} stroke="#fde68a" strokeWidth={2} strokeOpacity={0.6} />
      ))}
      <text x={4} y={20} fontSize="10" fill="#fde68a" fontWeight="700">
        Sun
      </text>
      <circle cx={cx} cy={cy} r={orbit} fill="none" stroke="rgba(255,255,255,0.18)" strokeDasharray="3 5" />
      <circle cx={cx} cy={cy} r={16} fill="#2f6fd1" />
      <path d={`M${cx} ${cy - 16} A16 16 0 0 1 ${cx} ${cy + 16}Z`} fill="#020617" fillOpacity={0.7} />
      <circle cx={mx} cy={my} r={9} fill="#cbd5e1" />
      <path d={`M${mx} ${my - 9} A9 9 0 0 1 ${mx} ${my + 9}Z`} fill="#020617" fillOpacity={0.75} />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke="rgba(94,231,255,0.35)" strokeDasharray="2 3" />
    </svg>
  )
}

export default function MoonPhasesLesson() {
  const reduced = useSimulationStore((s) => s.reducedMotion)
  const displayDays = useSimulationStore((s) => s.displayDays)
  const [phase, setPhase] = useState(() => moonPhase(displayDays))
  const [playing, setPlaying] = useState(!reduced)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setPhase((p) => (p + dt / 12) % 1)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const illuminated = (1 - Math.cos(phase * Math.PI * 2)) / 2
  const day = phase * SYNODIC_MONTH_DAYS

  return (
    <div>
      <LessonSection title="The Moon doesn’t change shape">
        <p>
          The Moon is always a round ball, and the Sun always lights up half of it. As the Moon travels around Earth, we see different
          amounts of its sunny half. That’s what makes the phases!
        </p>
      </LessonSection>

      <Figure caption={<ModelBadge />}>
        <div className="grid grid-cols-2 items-center gap-3">
          <div>
            <div className="mb-1 text-center text-xs font-semibold text-slate-400">From above</div>
            <OrbitView phase={phase} />
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-1 text-center text-xs font-semibold text-slate-400">What you see from Earth</div>
            <MoonView phase={phase} />
            <div className="font-display mt-2 text-lg font-bold text-white" aria-live="polite">
              {phaseName(phase)}
            </div>
            <div className="text-xs text-slate-400 tabular-nums">{formatNumber(illuminated * 100, 0)}% lit · day {formatNumber(day, 0)} of 29.5</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} label="Moon’s orbit" />
          <label className="flex-1">
            <span className="sr-only">Day of the lunar month</span>
            <input
              type="range"
              className="range"
              min={0}
              max={0.999}
              step={0.001}
              value={phase}
              onChange={(e) => {
                setPlaying(false)
                setPhase(Number(e.target.value))
              }}
            />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {KEY_PHASES.map((k) => (
            <button
              key={k.name}
              type="button"
              className="btn min-h-10 px-2.5 text-xs"
              onClick={() => {
                setPlaying(false)
                setPhase(k.phase)
              }}
            >
              <span className="w-4">
                <MoonView phase={k.phase} r={8} decorative />
              </span>
              {k.name}
            </button>
          ))}
          <button
            type="button"
            className="btn-primary min-h-10 px-3 text-xs"
            onClick={() => {
              setPlaying(false)
              setPhase(moonPhase(useSimulationStore.getState().displayDays))
            }}
          >
            Simulation date’s Moon
          </button>
        </div>
      </Figure>

      <LessonSection title="One full cycle takes about 29.5 days">
        <p>
          From one Full Moon to the next takes about a month – in fact, the word “month” comes from “Moon”! Watch the 3D view: the Moon
          circles Earth, and its sunny side always faces the Sun.
        </p>
      </LessonSection>
    </div>
  )
}
