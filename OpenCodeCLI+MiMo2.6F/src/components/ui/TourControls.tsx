import { AnimatePresence, motion } from 'framer-motion'
import { TOUR_STAGES } from '../../data/tour'
import { useSimStore } from '../../store/simulationStore'
import { CloseIcon, FastIcon, PauseIcon, PlayIcon } from './icons'
import { playBlip } from '../../utils/audio'

/**
 * Cinematic tour HUD: narration card, stage progress and transport controls.
 */
export function TourControls() {
  const tour = useSimStore((s) => s.tour)
  const toggleTourPause = useSimStore((s) => s.toggleTourPause)
  const skipTourStage = useSimStore((s) => s.skipTourStage)
  const stopTour = useSimStore((s) => s.stopTour)

  const stage = TOUR_STAGES[tour.stageIndex] ?? TOUR_STAGES[TOUR_STAGES.length - 1]

  return (
    <AnimatePresence>
      {tour.active && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:inset-x-auto sm:right-3 sm:bottom-3 sm:w-[26rem]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          role="region"
          aria-label="Cinematic tour narration"
        >
          <div className="panel rounded-3xl p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="hud-title text-[11px] text-cyan-300">
                Cinematic tour · {tour.stageIndex + 1}/{TOUR_STAGES.length}
              </span>
              <span className="text-[11px] text-white/50">
                {stage.id === 'system' ? 'Overview' : stage.title}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={stage.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45 }}
              >
                <h2 className="font-display text-2xl font-bold text-white">{stage.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/85">{stage.narration}</p>
              </motion.div>
            </AnimatePresence>

            {/* Progress */}
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {TOUR_STAGES.map((item, index) => (
                <span
                  key={`${item.title}-${index}`}
                  className={[
                    'h-1 flex-1 rounded-full transition-colors',
                    index < tour.stageIndex
                      ? 'bg-cyan-400/70'
                      : index === tour.stageIndex
                        ? 'bg-solar-400'
                        : 'bg-white/15',
                  ].join(' ')}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                className="chip"
                onClick={() => {
                  playBlip(520, 0.07)
                  toggleTourPause()
                }}
                aria-label={tour.paused ? 'Resume tour' : 'Pause tour'}
              >
                {tour.paused ? <PlayIcon width={14} height={14} /> : <PauseIcon width={14} height={14} />}
                {tour.paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  playBlip(700, 0.07)
                  skipTourStage()
                }}
                aria-label="Skip to the next tour stage"
              >
                <FastIcon width={14} height={14} /> Skip
              </button>
              <button
                type="button"
                className="chip ml-auto"
                onClick={() => {
                  playBlip(360, 0.1)
                  stopTour()
                }}
                aria-label="Exit the cinematic tour"
              >
                <CloseIcon width={14} height={14} /> Exit tour
              </button>
            </div>

            <p className="mt-2 text-[11px] leading-snug text-white/45">
              Sit back and enjoy — or press Exit to take the controls yourself.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
