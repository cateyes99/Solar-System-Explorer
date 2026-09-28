import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { SparkleIcon, CloseIcon } from './icons'

/** The animated card shown by the "Teach Me Something!" random-fact button. */
export function RandomFactCard() {
  const currentFact = useSimulationStore((s) => s.currentFact)
  const dismissFact = useSimulationStore((s) => s.dismissFact)
  const showRandomFact = useSimulationStore((s) => s.showRandomFact)

  return (
    <AnimatePresence>
      {currentFact && (
        <motion.div
          role="status"
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="glass-panel pointer-events-auto relative mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-cyan-glow/30 p-6 text-center"
        >
          <button
            type="button"
            onClick={dismissFact}
            aria-label="Dismiss fact"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <SparkleIcon className="h-8 w-8 text-cyan-glow" />
          <p className="text-lg font-medium leading-snug text-white">{currentFact}</p>
          <button
            type="button"
            onClick={showRandomFact}
            className="rounded-full bg-cyan-glow/20 px-4 py-2 text-sm font-medium text-cyan-glow ring-1 ring-cyan-glow/50 hover:bg-cyan-glow/30"
          >
            Another fact!
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
