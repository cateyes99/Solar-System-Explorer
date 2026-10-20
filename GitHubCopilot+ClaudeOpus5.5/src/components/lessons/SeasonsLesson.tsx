import { useEffect, useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { Figure, LessonSection, ModelBadge, PlayButton } from './common'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const CX = 170
const CY = 118
const RX = 128
const RY = 62
const TILT = 23.4

function seasons(month: number): { north: string; south: string } {
  if (month === 11 || month <= 1) return { north: 'Winter', south: 'Summer' }
  if (month <= 4) return { north: 'Spring', south: 'Autumn' }
  if (month <= 7) return { north: 'Summer', south: 'Winter' }
  return { north: 'Autumn', south: 'Spring' }
}

function EarthGlyph({ x, y, scale }: { x: number; y: number; scale: number }) {
  const r = 17 * scale
  const away = (Math.atan2(y - CY, x - CX) * 180) / Math.PI
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      <circle r={r} fill="#2f6fd1" />
      <path d={`M0 ${-r} A${r} ${r} 0 0 1 0 ${r} Z`} fill="#020617" fillOpacity={0.72} transform={`rotate(${away.toFixed(1)})`} />
      <g transform={`rotate(${-TILT})`}>
        <line x1={0} y1={-r * 1.6} x2={0} y2={r * 1.6} stroke="#e2e8f0" strokeWidth={2} />
        <line x1={-r} y1={0} x2={r} y2={0} stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="3 2" />
        <text x={0} y={-r * 1.6 - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#e2e8f0">
          N
        </text>
      </g>
    </g>
  )
}

export default function SeasonsLesson() {
  const reduced = useSimulationStore((s) => s.reducedMotion)
  const [month, setMonth] = useState(5.5)
  const [playing, setPlaying] = useState(!reduced)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setMonth((m) => (m + dt * 0.9) % 12)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const day = month * 30.44 + 15
  const theta = ((90 - ((day - 80) / 365.25) * 360) * Math.PI) / 180
  const x = CX + RX * Math.cos(theta)
  const y = CY + RY * Math.sin(theta)
  const scale = 1 + 0.18 * Math.sin(theta)
  const behind = Math.sin(theta) < 0
  const monthIndex = Math.floor(month) % 12
  const season = seasons(monthIndex)

  const sun = (
    <g>
      <circle cx={CX} cy={CY} r={34} fill="url(#season-glow)" />
      <circle cx={CX} cy={CY} r={18} fill="#ffc14d" />
    </g>
  )

  return (
    <div>
      <LessonSection title="Earth is tilted">
        <p>
          Earth’s spinning axis is tipped over by about <strong className="text-emerald-200">23.4°</strong>, and it always points the same
          way in space while Earth travels around the Sun.
        </p>
        <p>
          When your half of the world leans <em>towards</em> the Sun, sunlight hits it more directly and days are longer: that’s summer. When
          it leans <em>away</em>, sunlight is weaker and days are shorter: winter.
        </p>
      </LessonSection>

      <Figure caption={<ModelBadge />}>
        <svg viewBox="0 0 340 240" className="h-auto w-full" role="img" aria-label={`Earth in ${MONTHS[monthIndex]}: ${season.north} in the north, ${season.south} in the south`}>
          <defs>
            <radialGradient id="season-glow">
              <stop offset="0%" stopColor="#fff4c2" />
              <stop offset="100%" stopColor="#ff9a3c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 5" />
          {[
            ['Mar', CX, CY + RY + 16],
            ['Jun', CX + RX + 4, CY + 4],
            ['Sep', CX, CY - RY - 8],
            ['Dec', CX - RX - 4, CY + 4],
          ].map(([label, lx, ly]) => (
            <text key={label} x={lx} y={ly} textAnchor={label === 'Jun' ? 'start' : label === 'Dec' ? 'end' : 'middle'} fontSize="11" fill="#94a3b8" fontWeight="600">
              {label}
            </text>
          ))}
          {behind && <EarthGlyph x={x} y={y} scale={scale} />}
          {sun}
          {!behind && <EarthGlyph x={x} y={y} scale={scale} />}
        </svg>
        <div className="mt-2 flex items-center gap-3">
          <PlayButton playing={playing} onToggle={() => setPlaying((p) => !p)} label="Earth’s orbit" />
          <label className="flex-1">
            <span className="sr-only">Month</span>
            <input
              type="range"
              className="range"
              min={0}
              max={11.99}
              step={0.01}
              value={month}
              onChange={(e) => {
                setPlaying(false)
                setMonth(Number(e.target.value))
              }}
            />
          </label>
          <span className="w-24 text-right font-display font-bold text-white">{MONTHS[monthIndex]}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center" aria-live="polite">
          <div className="rounded-xl bg-white/[0.05] p-2">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Northern half</div>
            <div className="font-display text-lg font-bold text-emerald-200">{season.north}</div>
          </div>
          <div className="rounded-xl bg-white/[0.05] p-2">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Southern half</div>
            <div className="font-display text-lg font-bold text-sky-200">{season.south}</div>
          </div>
        </div>
      </Figure>

      <LessonSection title="It’s not about distance!">
        <p>
          Many people think summer happens when Earth is closer to the Sun. But Earth is actually a little <em>closer</em> to the Sun in
          early January – during winter in the north! The tilt is what really matters. That’s why Australia has summer at Christmas.
        </p>
      </LessonSection>
    </div>
  )
}
