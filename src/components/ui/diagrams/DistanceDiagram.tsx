import { useState } from 'react'
import { motion } from 'framer-motion'
import { PLANETS } from '../../../data/planets'

/** Distance strip with a travelling light pulse — how long sunlight takes. */
export function DistanceDiagram(): JSX.Element {
  const [selected, setSelected] = useState('earth')
  const planet = PLANETS.find((p) => p.id === selected) ?? PLANETS[2]
  const xOf = (au: number): number => 26 + (Math.sqrt(au) / Math.sqrt(30.07)) * 274
  const lightMinutes = (planet.distanceAU ?? 1) * 8.32

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 320 132" className="w-full" role="img" aria-label="Distance of planets from the Sun">
        <line x1="18" y1="66" x2="312" y2="66" stroke="rgba(255,255,255,0.12)" strokeDasharray="2 5" />
        {/* The Sun */}
        <circle cx="14" cy="66" r="9" fill="#ffb84d" />
        <circle cx="14" cy="66" r="14" fill="rgba(255,157,69,0.25)" />
        {PLANETS.map((p, i) => {
          const x = xOf(p.distanceAU)
          const isSel = p.id === selected
          return (
            <g key={p.id} onClick={() => setSelected(p.id)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={66} r={isSel ? 6 : 4} fill={p.color} stroke={isSel ? '#67e8f9' : 'none'} strokeWidth="2" />
              <text
                x={x}
                y={i % 2 === 0 ? 46 : 92}
                textAnchor="middle"
                fontSize="8.5"
                fill={isSel ? '#67e8f9' : 'rgba(255,255,255,0.6)'}
              >
                {p.name}
              </text>
            </g>
          )
        })}
        {/* Sunlight pulse travelling to the selected planet */}
        <motion.circle
          r="3"
          fill="#ffd27d"
          initial={{ cx: 26, cy: 66, opacity: 0 }}
          animate={{ cx: [26, xOf(planet.distanceAU ?? 1)], opacity: [0, 1, 1, 0] }}
          transition={{ duration: Math.min(3.4, 0.9 + (planet.distanceAU ?? 1) * 0.16), repeat: Infinity, repeatDelay: 0.8 }}
        />
        <text x="160" y="122" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)">
          Distances squeezed with √ — otherwise Neptune would be 3 metres away!
        </text>
      </svg>
      <p className="rounded-lg bg-white/[0.05] px-3 py-2 text-center text-[13px] text-white/85">
        ☀️ Sunlight reaches {planet.name} in about{' '}
        <strong className="text-astro-cyan">
          {lightMinutes >= 60
            ? `${(lightMinutes / 60).toFixed(1)} hours`
            : `${lightMinutes.toFixed(0)} minutes`}
        </strong>
        .
      </p>
    </div>
  )
}
