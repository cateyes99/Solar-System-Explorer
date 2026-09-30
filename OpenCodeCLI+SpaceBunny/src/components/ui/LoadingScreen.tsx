import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { mulberry32 } from '../../utils/math'

interface Props {
  /** 0..1 real generation progress. */
  progress: number
  /** True once the textures exist and the canvas has mounted. */
  ready: boolean
}

const STAGES = [
  'Mapping the Solar System',
  'Painting the planets',
  'Brewing the asteroid belt',
  'Lighting the Sun',
  'Counting the stars',
]

/**
 * A designed loading experience rather than a blank screen: a miniature orrery
 * draws itself while the real textures are generated on the CPU.
 */
export function LoadingScreen({ progress, ready }: Props) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const id = window.setInterval(() => setDots((d) => (d.length >= 3 ? '' : `${d}·`)), 380)
    return () => window.clearInterval(id)
  }, [])

  const percent = Math.round(Math.min(1, progress) * 100)
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(Math.min(0.999, progress) * STAGES.length))]

  const stars = useMemo(() => {
    const rand = mulberry32(7)
    return Array.from({ length: 60 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 0.5 + rand() * 1.6,
      delay: rand() * 3,
      opacity: 0.25 + rand() * 0.6,
    }))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
      className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden bg-void"
      role="status"
      aria-live="polite"
      aria-label={`Preparing the Solar System. ${percent} percent complete.`}
    >
      <div className="absolute inset-0" aria-hidden>
        {stars.map((star, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
            animate={{ opacity: [star.opacity * 0.4, star.opacity, star.opacity * 0.4] }}
            transition={{ duration: 2.4 + star.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Miniature orrery */}
      <svg
        viewBox="0 0 320 320"
        className="absolute h-[min(72vw,26rem)] w-[min(72vw,26rem)] opacity-70"
        aria-hidden
      >
        <defs>
          <radialGradient id="loadSun">
            <stop offset="0%" stopColor="#fff6d8" />
            <stop offset="45%" stopColor="#ffb347" />
            <stop offset="100%" stopColor="#ff7a2b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {[
          { r: 46, delay: 0.1 },
          { r: 72, delay: 0.25 },
          { r: 100, delay: 0.4 },
          { r: 128, delay: 0.55 },
          { r: 152, delay: 0.7 },
        ].map((orbit) => (
          <motion.circle
            key={orbit.r}
            cx="160"
            cy="160"
            r={orbit.r}
            fill="none"
            stroke="rgb(126 166 221 / 0.28)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.1, delay: orbit.delay, ease: 'easeOut' }}
          />
        ))}

        <motion.circle
          cx="160"
          cy="160"
          r="40"
          fill="url(#loadSun)"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ transformOrigin: '160px 160px' }}
        />
        <circle cx="160" cy="160" r="11" fill="#ffd88f" />

        {[
          { r: 46, c: '#9a8f86', speed: 9 },
          { r: 72, c: '#e6c187', speed: 13 },
          { r: 100, c: '#3b82f6', speed: 18 },
          { r: 128, c: '#c1440e', speed: 23 },
          { r: 152, c: '#d8a06a', speed: 32 },
        ].map((planet) => (
          <motion.circle
            key={planet.r}
            r="4"
            fill={planet.c}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <animateMotion
              dur={`${planet.speed}s`}
              repeatCount="indefinite"
              path={`M ${160 - planet.r} 160 a ${planet.r} ${planet.r} 0 1 0 ${
                planet.r * 2
              } 0 a ${planet.r} ${planet.r} 0 1 0 ${-planet.r * 2} 0`}
              rotate="0"
            />
          </motion.circle>
        ))}
      </svg>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">
        <p className="eyebrow mb-3">Solar System Explorer</p>
        <h2 className="text-balance text-[20px] font-semibold tracking-tight text-ice-50 sm:text-[24px]">
          Preparing the Solar System{ready ? '' : dots}
        </h2>
        <p className="mt-2 min-h-[1.25rem] text-[12.5px] text-ice-400">{stage}</p>

        <div className="mt-6 h-px w-full max-w-xs overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-cyan-glow"
            animate={{ width: `${ready ? 100 : Math.max(4, percent)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        <p className="mt-2 font-mono text-[11px] text-ice-400/70 tabular-nums">
          {ready ? 'Ready' : `${percent}%`}
        </p>

        {ready && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-5 text-[11.5px] text-ice-400/60"
          >
            Every planet is drawn from scratch by your browser — no images were downloaded.
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}