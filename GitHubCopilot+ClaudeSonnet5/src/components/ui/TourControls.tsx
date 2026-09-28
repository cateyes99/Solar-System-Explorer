import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { TOUR_STEPS } from '../../data/tour'
import { PlayIcon, PauseIcon, ChevronIcon } from './icons'

/** Narration card + progress dots + pause/resume/skip/exit controls for the Cinematic Tour. */
export function TourControls() {
  const isTourActive = useSimulationStore((s) => s.isTourActive)
  const isTourPaused = useSimulationStore((s) => s.isTourPaused)
  const tourStepIndex = useSimulationStore((s) => s.tourStepIndex)
  const pauseTour = useSimulationStore((s) => s.pauseTour)
  const resumeTour = useSimulationStore((s) => s.resumeTour)
  const exitTour = useSimulationStore((s) => s.exitTour)
  const setTourStepIndex = useSimulationStore((s) => s.setTourStepIndex)

  if (!isTourActive) return null

  const step = TOUR_STEPS[tourStepIndex]
  const isLast = tourStepIndex >= TOUR_STEPS.length - 1

  return (
    <div className="pointer-events-auto mx-auto flex w-full max-w-2xl flex-col gap-3 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35 }}
          className="glass-panel rounded-2xl p-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-electric-blue">Cinematic Tour</p>
          <h3 className="text-glow mt-1 text-lg font-semibold text-white">{step.title}</h3>
          <p className="mt-1 text-sm text-white/80">{step.narration}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
        {TOUR_STEPS.map((s, i) => (
          <span key={s.id} className={`h-1.5 rounded-full transition-all ${i === tourStepIndex ? 'w-6 bg-electric-blue' : 'w-1.5 bg-white/25'}`} />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pb-2">
        <button
          type="button"
          onClick={exitTour}
          aria-label="Exit tour"
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20"
        >
          Exit
        </button>
        <button
          type="button"
          onClick={() => (isTourPaused ? resumeTour() : pauseTour())}
          aria-label={isTourPaused ? 'Resume tour' : 'Pause tour'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-electric-blue/25 text-white ring-1 ring-electric-blue/60"
        >
          {isTourPaused ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => !isLast && setTourStepIndex(tourStepIndex + 1)}
          disabled={isLast}
          aria-label="Skip to next stop"
          className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 disabled:opacity-40"
        >
          Skip <ChevronIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
