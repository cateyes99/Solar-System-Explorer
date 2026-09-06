import { useEffect, useState } from 'react'
import { useSimulation } from '../../../store/simulationStore'

function phaseName(thetaDeg: number): string {
  if (thetaDeg < 22.5 || thetaDeg >= 337.5) return 'New Moon'
  if (thetaDeg < 67.5) return 'Waxing Crescent'
  if (thetaDeg < 112.5) return 'First Quarter'
  if (thetaDeg < 157.5) return 'Waxing Gibbous'
  if (thetaDeg < 202.5) return 'Full Moon'
  if (thetaDeg < 247.5) return 'Waning Gibbous'
  if (thetaDeg < 292.5) return 'Last Quarter'
  return 'Waning Crescent'
}

/** Moon orbiting Earth with a live "view from Earth" phase readout. */
export function MoonPhasesDiagram(): JSX.Element {
  const [theta, setTheta] = useState(20)
  const [playing, setPlaying] = useState(true)
  const [fast, setFast] = useState(false)
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const running = playing && !reduceMotion

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setTheta((t) => (t + (fast ? 4 : 1.4)) % 360)
    }, 60)
    return () => window.clearInterval(id)
  }, [running, fast])

  const rad = (theta * Math.PI) / 180
  // The Moon's sunlit side always faces the Sun (on the left).
  const moonX = 80 + Math.cos(rad) * 58
  const moonY = 100 - Math.sin(rad) * 58
  const illumination = (1 - Math.cos(rad)) / 2

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 320 200" className="w-full" role="img" aria-label="Moon phases demonstration">
        <defs>
          <clipPath id="mp-view">
            <circle cx="230" cy="100" r="34" />
          </clipPath>
        </defs>
        <text x="14" y="106" fontSize="20" fill="#ffb84d">
          ☀️
        </text>
        <circle cx="80" cy="100" r="14" fill="#3f8fd4" stroke="rgba(255,255,255,0.3)" />
        <text x="80" y="126" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)">
          Earth
        </text>
        <circle cx="80" cy="100" r="58" fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="3 5" />
        {/* Moon on its orbit: right half always lit (toward the Sun) */}
        <g>
          <circle cx={moonX} cy={moonY} r="7" fill="#d9d9de" />
          <path
            d={`M ${moonX} ${moonY - 7} A 7 7 0 0 1 ${moonX} ${moonY + 7} Z`}
            fill="#f4f4f6"
          />
          <path
            d={`M ${moonX} ${moonY - 7} A 7 7 0 0 0 ${moonX} ${moonY + 7} Z`}
            fill="#3a3d46"
          />
        </g>
        <text x="80" y="182" textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.5)">
          The lit half always points at the Sun
        </text>
        {/* View from Earth */}
        <text x="230" y="52" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.65)">
          What you see
        </text>
        <circle cx="230" cy="100" r="34" fill="#f4f4f6" />
        <g clipPath="url(#mp-view)">
          <circle cx={230 - illumination * 68} cy="100" r="34" fill="#101527" />
        </g>
        <text x="230" y="152" textAnchor="middle" fontSize="11" fontWeight="600" fill="#67e8f9">
          {phaseName(theta)}
        </text>
        <text x="230" y="167" textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.55)">
          {Math.round(illumination * 100)}% lit
        </text>
      </svg>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className="chip !px-2" onClick={() => setPlaying(!playing)} aria-pressed={playing}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button type="button" className={`chip !px-2 ${fast ? 'chip-active' : ''}`} onClick={() => setFast(!fast)} aria-pressed={fast}>
          ⏩ Faster
        </button>
        <span className="text-[11px] text-white/40">One full trip around Earth: 27.3 days</span>
      </div>
    </div>
  )
}
