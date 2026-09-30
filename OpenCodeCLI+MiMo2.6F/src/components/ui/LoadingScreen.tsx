import { motion } from 'framer-motion'

interface LoadingScreenProps {
  progress: number
}

const STARS = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  top: `${(index * 53) % 100}%`,
  delay: `${(index % 9) * 0.32}s`,
  size: index % 5 === 0 ? 4 : 2,
}))

/**
 * Boot screen: miniature Sun with orbiting dots, twinkling stars and a real
 * progress bar tied to texture generation.
 */
export function LoadingScreen({ progress }: LoadingScreenProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100)

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-space-950"
      role="status"
      aria-live="polite"
      aria-label="Loading the Solar System"
    >
      {/* Twinkling stars */}
      {STARS.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animation: `twinkle ${2.2 + (index % 4) * 0.6}s ease-in-out ${star.delay} infinite`,
          }}
          aria-hidden="true"
        />
      ))}

      <div className="relative grid place-items-center px-6 text-center">
        {/* Mini solar system */}
        <div className="relative mb-8 h-44 w-44">
          <div className="absolute inset-0 rounded-full border border-cyan-400/30" aria-hidden="true" />
          <div
            className="absolute inset-5 rounded-full border border-electric-400/40"
            aria-hidden="true"
          />
          <div
            className="absolute inset-10 rounded-full border border-nebula-400/40"
            aria-hidden="true"
          />

          {/* Orbiting dots */}
          <div
            className="absolute inset-0 animate-[orbit-spin_3.4s_linear_infinite]"
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8]" />
          </div>
          <div
            className="absolute inset-5 animate-[orbit-spin_5.6s_linear_infinite]"
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-solar-400 shadow-[0_0_10px_#ffb347]" />
          </div>
          <div
            className="absolute inset-10 animate-[orbit-spin_8.5s_linear_infinite]"
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nebula-400 shadow-[0_0_12px_#9d7bff]" />
          </div>

          {/* Mini Sun */}
          <motion.span
            className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-solar-400"
            animate={{ boxShadow: ['0 0 20px #ffb347', '0 0 55px #ff8c1a', '0 0 20px #ffb347'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        </div>

        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Preparing the Solar System…
        </h1>
        <p className="mt-2 text-sm text-cyan-200/80">
          Painting planets, igniting the Sun, scattering the stars
        </p>

        {/* Progress */}
        <div
          className="mt-6 h-2 w-64 max-w-[80vw] overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Loading progress"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric-500 via-cyan-400 to-solar-400"
            initial={{ width: '0%' }}
            animate={{ width: `${percent}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
        <p className="mt-2 text-xs text-white/50">{percent}%</p>
      </div>
    </div>
  )
}
