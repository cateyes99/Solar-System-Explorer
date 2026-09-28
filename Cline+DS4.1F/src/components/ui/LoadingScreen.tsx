import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * The loading screen.
 *
 * Generated textures take a moment, so instead of a blank screen the visitor gets
 * a miniature Solar System: a glowing Sun, orbiting dots and a progress bar with
 * a running commentary on what is being painted.
 */
export function LoadingScreen() {
  const ready = useSimulationStore((state) => state.ready)
  const progress = useSimulationStore((state) => state.assetsProgress)
  const label = useSimulationStore((state) => state.assetsLabel)

  return (
    <AnimatePresence>
      {!ready ? (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-50 grid place-items-center bg-[radial-gradient(circle_at_50%_45%,#0b1330_0%,#04060f_65%)]"
          role="status"
          aria-live="polite"
        >
          <div className="w-[min(26rem,88vw)] text-center">
            <div className="relative mx-auto mb-8 h-40 w-40">
              {/* Slowly rotating orbits with a tiny planet on each. */}
              {[
                { size: 160, duration: 7, colour: '#4fd8ff' },
                { size: 120, duration: 5, colour: '#ff8a2b' },
                { size: 84, duration: 3.4, colour: '#8a5cff' },
              ].map((orbit) => (
                <span
                  key={orbit.size}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 rounded-full border border-white/12"
                  style={{
                    width: orbit.size,
                    height: orbit.size,
                    marginLeft: -orbit.size / 2,
                    marginTop: -orbit.size / 2,
                    animation: `orbit-spin ${orbit.duration}s linear infinite`,
                  }}
                >
                  <span
                    className="absolute h-2.5 w-2.5 rounded-full"
                    style={{
                      background: orbit.colour,
                      boxShadow: `0 0 12px 2px ${orbit.colour}`,
                      left: -5,
                      top: orbit.size / 2 - 5,
                    }}
                  />
                </span>
              ))}
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full animate-soft-pulse"
                style={{
                  background: 'radial-gradient(circle at 36% 32%, #fff6d0 0%, #ffbf49 45%, #ff7a18 75%, rgba(255,90,0,0) 78%)',
                  boxShadow: '0 0 60px 14px rgba(255,138,43,0.35)',
                }}
              />
            </div>

            <h2 className="sse-text-shadow text-sm font-semibold uppercase tracking-[0.34em] text-parchment">
              Preparing the Solar System…
            </h2>
            <p className="mt-2 min-h-[1.2rem] text-xs text-mist">{label}</p>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-electric via-ice to-violet"
                animate={{ width: `${Math.round(Math.min(1, Math.max(0.02, progress)) * 100)}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            </div>
            <p className="sse-numeric mt-2 text-[0.68rem] text-mist/80">
              {Math.round(Math.min(1, progress) * 100)}% · textures are drawn in your browser, nothing is downloaded
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}