import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'

const ORBITS = [
  { size: 76, duration: 3.2, color: '#b8b8bd', dot: 7, dir: 'normal' },
  { size: 104, duration: 4.6, color: '#4da6ff', dot: 8, dir: 'reverse' },
  { size: 134, duration: 6.4, color: '#e07a4f', dot: 7, dir: 'normal' },
]

const STARS = [
  [12, 18], [80, 9], [90, 32], [8, 60], [22, 82], [70, 88], [93, 70], [45, 6], [60, 94], [5, 40], [96, 50], [35, 92],
]

/** Decorative mini solar system used by the loading + fallback screens. */
export function MiniSystem({ paused = false }: { paused?: boolean }): JSX.Element {
  return (
    <div className="relative h-44 w-44" aria-hidden>
      {STARS.map(([x, y], i) => (
        <span
          key={i}
          className="mini-star"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.4}s`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      ))}
      <div className="mini-sun" style={{ animationPlayState: paused ? 'paused' : 'running' }} />
      {ORBITS.map((o, i) => (
        <div
          key={i}
          className="absolute"
          style={{ width: o.size, height: o.size, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="mini-orbit"
            style={{
              animationDuration: `${o.duration}s`,
              animationDirection: o.dir === 'reverse' ? 'reverse' : 'normal',
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            <span
              className="mini-planet"
              style={{ background: o.color, width: o.dot, height: o.dot, top: -o.dot / 2, marginLeft: -o.dot / 2 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Beautiful loading screen shown until the 3D scene is ready. */
export function LoadingScreen(): JSX.Element {
  const { progress, active } = useProgress()
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setMinTimePassed(true), 1700)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    // All assets here are procedural, so the loader is often completely quiet
    // (active === false, progress === 0). Treat a quiet loader as ready too.
    if (minTimePassed && !active && (progress >= 100 || progress === 0)) setHidden(true)
  }, [progress, active, minTimePassed])

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="loading"
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-space-950"
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
          role="status"
          aria-live="polite"
        >
          <MiniSystem />
          <p className="mt-8 font-display text-sm tracking-[0.22em] text-white/80">
            PREPARING THE SOLAR SYSTEM…
          </p>
          <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-astro-blue transition-all duration-300"
              style={{ width: `${Math.max(12, progress)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-white/40">{Math.round(progress)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
