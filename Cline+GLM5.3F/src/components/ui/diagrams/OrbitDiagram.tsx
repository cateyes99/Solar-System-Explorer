import { motion } from 'framer-motion'
import { useSimulation } from '../../../store/simulationStore'

/** Gravity + speed = orbit. Animated arrows show the two cosmic dance partners. */
export function OrbitDiagram(): JSX.Element {
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const duration = reduceMotion ? 0 : 9

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 320 224" className="w-full" role="img" aria-label="Orbit demonstration">
        <defs>
          <marker id="od-cyan" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#67e8f9" />
          </marker>
          <marker id="od-orange" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#ff9d45" />
          </marker>
        </defs>
        <circle cx="160" cy="104" r="26" fill="rgba(255,157,69,0.2)" />
        <circle cx="160" cy="104" r="15" fill="#ffb84d" />
        <text x="160" y="109" textAnchor="middle" fontSize="13">
          ☀️
        </text>
        <circle
          cx="160"
          cy="104"
          r="72"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="4 5"
        />
        <motion.g
          animate={duration > 0 ? { rotate: 360 } : undefined}
          transition={duration > 0 ? { repeat: Infinity, ease: 'linear', duration } : undefined}
          style={{ transformOrigin: '160px 104px', transformBox: 'view-box' }}
        >
          {/* Planet on the right of the orbit */}
          <circle cx="232" cy="104" r="9" fill="#e07a4f" stroke="rgba(255,255,255,0.4)" />
          {/* Velocity: tangent to the orbit */}
          <line x1="232" y1="92" x2="232" y2="48" stroke="#67e8f9" strokeWidth="2.5" markerEnd="url(#od-cyan)" />
          <text x="241" y="62" fontSize="10" fill="#67e8f9">
            speed
          </text>
          {/* Gravity: pulled toward the Sun */}
          <line x1="221" y1="113" x2="184" y2="112" stroke="#ff9d45" strokeWidth="2.5" markerEnd="url(#od-orange)" />
          <text x="186" y="130" fontSize="10" fill="#ff9d45">
            gravity
          </text>
        </motion.g>
        <text x="160" y="212" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)">
          Fall toward the Sun + keep moving sideways = loop forever!
        </text>
      </svg>
      <p className="rounded-lg bg-white/[0.05] px-3 py-2 text-[12px] leading-snug text-white/75">
        Gravity (orange) constantly bends the planet's path toward the Sun, while its speed (cyan)
        keeps it moving forward. Together they make a perfect orbit. 🛰️
      </p>
    </div>
  )
}
