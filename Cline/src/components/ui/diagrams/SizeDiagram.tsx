import { useState } from 'react'
import { motion } from 'framer-motion'
import { PLANETS } from '../../../data/planets'
import { SUN } from '../../../data/bodies'

const BODIES = [
  { id: 'sun', name: 'The Sun', d: SUN.diameterKm, color: '#ffb84d' },
  ...PLANETS.map((p) => ({ id: p.id, name: p.name, d: p.diameterKm, color: p.color })),
]

/** Animated size comparison — real relative diameters. */
export function SizeDiagram(): JSX.Element {
  const [aId, setAId] = useState('earth')
  const [bId, setBId] = useState('jupiter')
  const a = BODIES.find((b) => b.id === aId) ?? BODIES[3]
  const b = BODIES.find((x) => x.id === bId) ?? BODIES[4]

  // Jupiter's radius maps to 62 px; the Sun is capped to a giant arc.
  const radiusOf = (d: number): number => (d >= 1_000_000 ? 88 : Math.max(3.5, (d / 139_820) * 62))
  const ra = radiusOf(a.d)
  const rb = radiusOf(b.d)
  const ratio = a.d / b.d

  const ChipRow = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }): JSX.Element => (
    <div className="flex flex-wrap items-center gap-1">
      <span className="stat-label mr-1">{label}</span>
      {BODIES.map((body) => (
        <button
          key={body.id}
          type="button"
          className={`chip !px-2 ${value === body.id ? 'chip-active' : ''}`}
          onClick={() => onChange(body.id)}
          aria-pressed={value === body.id}
        >
          {body.name.replace('The ', '')}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 320 232" className="w-full" role="img" aria-label="Animated planet size comparison">
        <line x1="0" y1="195" x2="320" y2="195" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 4" />
        <motion.circle
          fill={a.color}
          stroke="rgba(255,255,255,0.35)"
          animate={{ cx: 92, cy: 195 - ra, r: ra }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        />
        <motion.circle
          fill={b.color}
          stroke="rgba(255,255,255,0.35)"
          animate={{ cx: 228, cy: 195 - rb, r: rb }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        />
        <text x="92" y="212" textAnchor="middle" fontSize="11" fill="#ffffffcc">
          {a.name}
        </text>
        <text x="228" y="212" textAnchor="middle" fontSize="11" fill="#ffffffcc">
          {b.name}
        </text>
      </svg>
      <p className="rounded-lg bg-white/[0.05] px-3 py-2 text-center text-[13px] text-white/85">
        {a.name} is{' '}
        <strong className="text-astro-cyan">
          {ratio >= 1 ? `${ratio.toFixed(1)}× wider than` : `${(1 / ratio).toFixed(1)}× narrower than`}
        </strong>{' '}
        {b.name}.
        {(a.id === 'sun' || b.id === 'sun') && ' The Sun is so big its edge goes off the chart!'}
      </p>
      <div className="space-y-1.5">
        <ChipRow value={aId} onChange={setAId} label="Left:" />
        <ChipRow value={bId} onChange={setBId} label="Right:" />
      </div>
    </div>
  )
}
