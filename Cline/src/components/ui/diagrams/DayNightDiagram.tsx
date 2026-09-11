import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimulation } from '../../../store/simulationStore'

const SPEEDS = [
  { label: 'Slow', duration: 14 },
  { label: 'Normal', duration: 8 },
  { label: 'Fast', duration: 3.5 },
]

/** Earth spinning under fixed sunlight — why we get day and night. */
export function DayNightDiagram(): JSX.Element {
  const [speedIdx, setSpeedIdx] = useState(1)
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const duration = reduceMotion ? 0 : SPEEDS[speedIdx].duration

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 320 200" className="w-full" role="img" aria-label="Day and night demonstration">
        <defs>
          <radialGradient id="dn-earth" cx="35%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#3f8fd4" />
            <stop offset="100%" stopColor="#123a63" />
          </radialGradient>
          <clipPath id="dn-clip">
            <circle cx="160" cy="100" r="58" />
          </clipPath>
        </defs>
        {/* Sun rays from the left */}
        {[64, 100, 136].map((y) => (
          <g key={y} stroke="#ffd27d" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1={y} x2="66" y2={y} />
            <path d={`M 60 ${y - 5} L 70 ${y} L 60 ${y + 5}`} fill="none" />
          </g>
        ))}
        <text x="20" y="40" fontSize="20" fill="#ffb84d">
          ☀️
        </text>
        {/* Earth */}
        <circle cx="160" cy="100" r="58" fill="url(#dn-earth)" stroke="rgba(255,255,255,0.3)" />
        {/* Night side shadow */}
        <path d="M 160 42 A 58 58 0 0 1 160 158 Z" fill="rgba(2,4,12,0.78)" />
        {/* Equator */}
        <line x1="106" y1="100" x2="214" y2="100" stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
        {/* Rotating city marker */}
        <motion.g
          animate={duration > 0 ? { rotate: 360 } : undefined}
          transition={duration > 0 ? { repeat: Infinity, ease: 'linear', duration } : undefined}
          style={{ transformOrigin: '160px 100px', transformBox: 'view-box' }}
        >
          <circle cx="214" cy="100" r="5" fill="#ffd27d" stroke="#0b1226" strokeWidth="1.5" />
          <text x="214" y="88" textAnchor="middle" fontSize="13">
            🏠
          </text>
        </motion.g>
        <text x="160" y="186" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)">
          The house spins from day into night as Earth rotates.
        </text>
      </svg>
      <div className="flex flex-wrap items-center gap-1">
        <span className="stat-label mr-1">Spin speed:</span>
        {SPEEDS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className={`chip !px-2 ${i === speedIdx ? 'chip-active' : ''}`}
            onClick={() => setSpeedIdx(i)}
            aria-pressed={i === speedIdx}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
