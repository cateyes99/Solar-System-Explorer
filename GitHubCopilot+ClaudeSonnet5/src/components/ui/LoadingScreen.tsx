import { motion } from 'framer-motion'

interface LoadingScreenProps {
  progress: number
}

/** A deliberate, honest intro splash \u2014 progress reflects real scene readiness plus a minimum display time. */
export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <motion.div
      key="loading"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-space-black"
    >
      <div className="relative h-28 w-28">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 60px 20px rgba(255,157,77,0.35)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-200 via-solar-orange to-orange-600" />
        <motion.div
          className="absolute -inset-3 rounded-full border border-electric-blue/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -inset-7 rounded-full border border-white/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-glow text-lg font-medium text-white">Preparing the Solar System…</p>
        <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric-blue to-cyan-glow"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}
