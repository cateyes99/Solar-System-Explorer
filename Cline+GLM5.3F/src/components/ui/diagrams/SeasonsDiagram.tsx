import { motion } from 'framer-motion'
import { useSimulation } from '../../../store/simulationStore'

const ORBIT = { cx: 170, cy: 104, rx: 118, ry: 60 }

/** Earth's fixed axial tilt carried around the Sun — the recipe for seasons. */
export function SeasonsDiagram(): JSX.Element {
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const duration = reduceMotion ? 0 : 16

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 340 210" className="w-full" role="img" aria-label="Seasons demonstration">
        <ellipse
          cx={ORBIT.cx}
          cy={ORBIT.cy}
          rx={ORBIT.rx}
          ry={ORBIT.ry}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="3 5"
        />
        {/* The Sun sits at the centre of the orbit */}
        <circle cx={ORBIT.cx} cy={ORBIT.cy} r="16" fill="#ffb84d" />
        <circle cx={ORBIT.cx} cy={ORBIT.cy} r="24" fill="rgba(255,157,69,0.22)" />
        <text x={ORBIT.cx} y={ORBIT.cy + 5} textAnchor="middle" fontSize="14">
          ☀️
        </text>

        {/* Orbiting Earth; the inner counter-rotation keeps the axis fixed in space */}
        <motion.g
          animate={duration > 0 ? { rotate: 360 } : undefined}
          transition={duration > 0 ? { repeat: Infinity, ease: 'linear', duration } : undefined}
          style={{ transformOrigin: `${ORBIT.cx}px ${ORBIT.cy}px`, transformBox: 'view-box' }}
        >
          <motion.g
            animate={duration > 0 ? { rotate: -360 } : undefined}
            transition={duration > 0 ? { repeat: Infinity, ease: 'linear', duration } : undefined}
            style={{ transformOrigin: `${ORBIT.cx + ORBIT.rx}px ${ORBIT.cy}px`, transformBox: 'view-box' }}
          >
            <circle cx={ORBIT.cx + ORBIT.rx} cy={ORBIT.cy} r="13" fill="#3f8fd4" stroke="rgba(255,255,255,0.35)" />
            <line
              x1={ORBIT.cx + ORBIT.rx - 7}
              y1={ORBIT.cy + 12}
              x2={ORBIT.cx + ORBIT.rx + 7}
              y2={ORBIT.cy - 12}
              stroke="#ffd27d"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={ORBIT.cx + ORBIT.rx + 7} cy={ORBIT.cy - 12} r="2.4" fill="#fff" />
          </motion.g>
        </motion.g>

        {/* Season labels (northern hemisphere) */}
        <text x="316" y="97" textAnchor="end" fontSize="10.5" fill="#67e8f9">
          Summer (north)
        </text>
        <text x="26" y="97" textAnchor="start" fontSize="10.5" fill="rgba(255,255,255,0.65)">
          Winter (north)
        </text>
        <text x={ORBIT.cx} y="24" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,0.65)">
          Spring
        </text>
        <text x={ORBIT.cx} y="200" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,0.65)">
          Autumn
        </text>
      </svg>
      <p className="rounded-lg bg-white/[0.05] px-3 py-2 text-[12px] leading-snug text-white/75">
        Earth's axis (the golden stick) always leans the <strong className="text-white">same way</strong>.
        When your half leans toward the Sun you get summer — when it leans away, winter!
      </p>
    </div>
  )
}
