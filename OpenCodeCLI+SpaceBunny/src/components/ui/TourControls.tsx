import { AnimatePresence, motion } from 'framer-motion'
import { TOUR_STAGES } from '../../data/tour'
import { useAppStore } from '../../store/useAppStore'
import { Icon } from './Icon'
import { IconButton } from './primitives/Button'
import { spaceAudio } from '../../utils/audio'

export function TourControls() {
  const tourActive = useAppStore((s) => s.tourActive)
  const tourPaused = useAppStore((s) => s.tourPaused)
  const toggleTourPaused = useAppStore((s) => s.toggleTourPaused)
  const setTourStage = useAppStore((s) => s.setTourStage)
  const exitTour = useAppStore((s) => s.exitTour)
  const tourStage = useAppStore((s) => s.tourStage)

  const stage = TOUR_STAGES[Math.min(tourStage, TOUR_STAGES.length - 1)]
  const isLast = tourStage >= TOUR_STAGES.length - 1
  const progress = ((tourStage + 1) / TOUR_STAGES.length) * 100

  return (
    <AnimatePresence>
      {tourActive && (
        <motion.div
          key="tour"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 sm:px-5 sm:pb-5"
        >
          <div className="panel pointer-events-auto w-full max-w-2xl overflow-hidden">
            <div className="h-px w-full bg-white/8">
              <motion.div
                className="h-px bg-cyan-glow"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] tracking-wider text-cyan-200/80 tabular-nums">
                  {String(tourStage + 1).padStart(2, '0')}/{String(TOUR_STAGES.length).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold tracking-tight text-ice-50">{stage.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-ice-200/80" aria-live="polite">
                    {stage.narration}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <IconButton
                    icon={tourPaused ? 'play' : 'pause'}
                    label={tourPaused ? 'Resume the tour' : 'Pause the tour'}
                    onClick={() => {
                      toggleTourPaused()
                      spaceAudio.play('click')
                    }}
                    className="h-9 w-9"
                  />
                  <IconButton
                    icon="skip"
                    label="Skip to the next stop"
                    onClick={() => {
                      if (isLast) exitTour()
                      else setTourStage(tourStage + 1)
                      spaceAudio.play('click')
                    }}
                    className="h-9 w-9"
                  />
                </div>

                <button
                  type="button"
                  onClick={exitTour}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-ice-400 transition-colors hover:text-ice-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <Icon name="close" size={14} />
                  Exit tour
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}