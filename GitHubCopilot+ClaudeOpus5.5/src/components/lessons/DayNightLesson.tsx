import { useEffect, useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { Figure, LessonSection, ModelBadge, PlayButton } from './common'

const CX = 160
const CY = 120
const R = 70

function formatHour(hour: number): string {
  const h = Math.floor(hour) % 24
  const m = Math.floor((hour - Math.floor(hour)) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function DayNightLesson() {
  const reduced = useSimulationStore((s) => s.reducedMotion)
  const [hour, setHour] = useState(9)
  const [playing, setPlaying] = useState(!reduced)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setHour((h) => (h + dt * 2) % 24)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const angle = Math.PI - ((hour - 12) * Math.PI) / 12
  const hx = CX + Math.cos(angle) * R
  const hy = CY + Math.sin(angle) * R
  const daytime = Math.cos(angle) < 0
  const twilight = Math.abs(Math.cos(angle)) < 0.15

  return (
    <div>
      <LessonSection title="Earth is a spinning ball">
        <p>
          Earth spins all the way around once every <strong className="text-sky-200">24 hours</strong>. The half facing the Sun has day;
          the half facing away has night.
        </p>
        <p>
          The Sun doesn’t really move across the sky – <em>we</em> do! As Earth turns, your home spins into sunlight (sunrise) and later
          spins away from it (sunset).
        </p>
      </LessonSection>

      <Figure caption={<ModelBadge>Looking down on the North Pole</ModelBadge>}>
        <svg viewBox="0 0 320 240" className="h-auto w-full" role="img" aria-label={`Earth from above. The little house is in ${daytime ? 'daytime' : 'night-time'} at about ${formatHour(hour)}`}>
          <defs>
            <linearGradient id="dn-shade" x1="0" x2="1">
              <stop offset="0.48" stopColor="#000" stopOpacity="0" />
              <stop offset="0.52" stopColor="#020617" stopOpacity="0.82" />
            </linearGradient>
            <radialGradient id="dn-earth" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#7cc4ff" />
              <stop offset="70%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </radialGradient>
          </defs>
          {[50, 90, 130, 170, 210].map((y) => (
            <g key={y}>
              <line x1={8} y1={y} x2={62} y2={y} stroke="#fde68a" strokeWidth={2} strokeOpacity={0.6} />
              <path d={`M62 ${y - 4} L70 ${y} L62 ${y + 4}z`} fill="#fde68a" fillOpacity={0.6} />
            </g>
          ))}
          <text x={10} y={30} fill="#fde68a" fontSize="12" fontWeight="700">
            Sunlight
          </text>
          <g transform={`rotate(${(-(hour - 12) * 15).toFixed(2)} ${CX} ${CY})`}>
            <circle cx={CX} cy={CY} r={R} fill="url(#dn-earth)" />
            <path d={`M${CX - 30} ${CY - 25} q 20 -20 40 -5 q 10 25 -10 35 q -25 5 -30 -30z`} fill="#4d7c3a" opacity="0.9" />
            <path d={`M${CX + 15} ${CY + 18} q 25 -5 30 15 q -15 20 -35 5z`} fill="#4d7c3a" opacity="0.9" />
          </g>
          <circle cx={CX} cy={CY} r={R} fill="url(#dn-shade)" />
          <circle cx={CX} cy={CY} r={5} fill="#e2e8f0" />
          <g transform={`translate(${hx} ${hy}) rotate(${((angle * 180) / Math.PI + 90).toFixed(2)})`}>
            <path d="M-7 0 L0 -9 L7 0 L7 8 L-7 8z" fill={daytime ? '#fbbf24' : '#94a3b8'} stroke="#0f172a" strokeWidth={1.5} transform="translate(0 -6)" />
          </g>
          <text x={CX + R + 14} y={CY - R} fill="#94a3b8" fontSize="12" fontWeight="600">
            Night side
          </text>
          <text x={CX - R - 4} y={CY + R + 20} fill="#fde68a" fontSize="12" fontWeight="600">
            Day side
          </text>
        </svg>
        <div className="mt-2 flex items-center gap-3">
          <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} label="Earth spinning" />
          <label className="flex-1">
            <span className="sr-only">Time of day</span>
            <input type="range" className="range" min={0} max={23.99} step={0.05} value={hour} onChange={(e) => { setPlaying(false); setHour(Number(e.target.value)) }} />
          </label>
          <span className="w-14 text-right font-display font-bold text-white tabular-nums">{formatHour(hour)}</span>
        </div>
        <p className="mt-1 text-center text-sm font-semibold" aria-live="polite">
          {twilight ? (
            <span className="text-orange-200">{hour < 12 ? 'Sunrise! The house is spinning into the light.' : 'Sunset! The house is spinning into darkness.'}</span>
          ) : daytime ? (
            <span className="text-amber-200">Daytime at the little house</span>
          ) : (
            <span className="text-slate-300">Night-time at the little house</span>
          )}
        </p>
      </Figure>

      <LessonSection title="Watch it in 3D">
        <p>
          We’ve zoomed in on Earth and slowed time down so one Earth day passes in about 10 seconds. Look for the line between day and
          night, and the city lights twinkling on the night side.
        </p>
      </LessonSection>
    </div>
  )
}
