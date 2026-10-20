import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

const ORBITS = [
  { size: 120, duration: 4, color: '#a19d97', dot: 6 },
  { size: 180, duration: 7, color: '#4f8edc', dot: 9 },
  { size: 250, duration: 11, color: '#d0623a', dot: 7 },
  { size: 330, duration: 18, color: '#d8b48c', dot: 14 },
]

export function LoadingScreen() {
  const ready = useSimulationStore((s) => s.sceneReady)
  const progress = useSimulationStore((s) => s.loadProgress)
  const label = useSimulationStore((s) => s.loadLabel)
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: `${(i * 37.7) % 100}%`,
        top: `${(i * 61.3) % 100}%`,
        size: 1 + ((i * 7) % 3),
        delay: `${(i % 10) * 0.35}s`,
      })),
    [],
  )
  const percent = Math.round(progress * 100)

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#0b1430_0%,#02030a_70%)]"
          exit={{ opacity: 0, transition: { duration: 1.2, ease: 'easeInOut' } }}
          role="status"
          aria-live="polite"
          aria-label={`Preparing the Solar System, ${percent} percent`}
        >
          {stars.map((s, i) => (
            <span
              key={i}
              className="animate-twinkle absolute rounded-full bg-white"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
              aria-hidden="true"
            />
          ))}
          <div className="relative flex flex-col items-center">
            <div className="relative grid h-[340px] w-[340px] scale-75 place-items-center sm:scale-100" aria-hidden="true">
              {ORBITS.map((o) => (
                <div
                  key={o.size}
                  className="animate-orbit absolute rounded-full border border-white/10"
                  style={{ width: o.size, height: o.size, animationDuration: `${o.duration}s` }}
                >
                  <span
                    className="absolute top-1/2 -right-[1px] rounded-full"
                    style={{
                      width: o.dot,
                      height: o.dot,
                      background: o.color,
                      transform: 'translate(50%, -50%)',
                      boxShadow: `0 0 12px ${o.color}`,
                    }}
                  />
                </div>
              ))}
              <div
                className="animate-sun h-16 w-16 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 40% 40%, #fff6d0, #ffb347 55%, #ff7a1a)',
                  boxShadow: '0 0 40px 12px rgba(255,160,60,0.55), 0 0 110px 30px rgba(255,120,30,0.25)',
                }}
              />
            </div>
            <h1 className="font-display -mt-4 text-2xl font-bold text-white sm:text-3xl">Preparing the Solar System…</h1>
            <p className="mt-2 h-5 text-sm text-slate-400">{label}</p>
            <div
              className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label="Loading progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-sky-300 to-violet-400 transition-[width] duration-300"
                style={{ width: `${Math.max(4, percent)}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500 tabular-nums">{percent}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
