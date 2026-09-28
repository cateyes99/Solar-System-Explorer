import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TOUR_STAGES } from '../../data/tour'
import { useSimulationStore } from '../../store/simulationStore'
import { ToolbarButton } from './primitives'
import { BackIcon, CloseIcon, ForwardIcon, PauseIcon, PlayIcon } from './icons'

/**
 * Cinematic Tour controls and narration.
 *
 * The progress bar is driven by requestAnimationFrame and writes straight to the
 * DOM, so a smooth animation costs zero React renders.
 */
export function TourControls() {
  const active = useSimulationStore((state) => state.cinematic.active)
  const paused = useSimulationStore((state) => state.cinematic.paused)
  const stageIndex = useSimulationStore((state) => state.cinematic.stageIndex)
  const pauseTour = useSimulationStore((state) => state.pauseTour)
  const resumeTour = useSimulationStore((state) => state.resumeTour)
  const setTourStage = useSimulationStore((state) => state.setTourStage)
  const exitTour = useSimulationStore((state) => state.exitTour)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)

  const barRef = useRef<HTMLDivElement>(null)

  const stage = TOUR_STAGES[stageIndex]
  const duration = stage ? (reducedMotion ? stage.duration * 0.65 : stage.duration) : 6

  useEffect(() => {
    if (!active || !stage) return
    let frame = 0
    const started = performance.now()
    // Continue from wherever the bar was when the tour was paused.
    const base = paused ? Number.parseFloat(barRef.current?.dataset.progress ?? '0') : 0

    const tick = (now: number): void => {
      const elapsed = (now - started) / 1000 + base * duration
      const progress = Math.min(1, elapsed / duration)
      const bar = barRef.current
      if (bar) {
        bar.style.width = `${(progress * 100).toFixed(2)}%`
        bar.dataset.progress = String(progress)
      }
      if (progress < 1 && !useSimulationStore.getState().cinematic.paused) {
        frame = requestAnimationFrame(tick)
      }
    }

    if (!paused) frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, paused, stageIndex, duration, stage])

  return (
    <AnimatePresence>
      {active && stage ? (
        <motion.div
          key="tour-controls"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed inset-x-3 top-[7.2rem] z-40 mx-auto max-w-[46rem] sm:left-4 sm:right-auto sm:top-[6.4rem]"
          role="region"
          aria-label="Cinematic tour"
        >
          <div className="sse-panel overflow-hidden p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="sse-label-text">
                  Tour · {stageIndex + 1} / {TOUR_STAGES.length}
                </span>
              </div>
              <div className="flex items-center gap-1" aria-hidden="true">
                {TOUR_STAGES.map((entry, index) => (
                  <span
                    key={entry.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === stageIndex ? 'w-5 bg-ice' : index < stageIndex ? 'w-1.5 bg-ice/50' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h2 className="sse-text-shadow mt-2 text-lg font-semibold text-parchment">{stage.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-parchment/92">{stage.narration}</p>

            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/12">
              <div ref={barRef} className="h-full rounded-full bg-gradient-to-r from-electric to-ice" style={{ width: '0%' }} data-progress="0" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <ToolbarButton
                compact
                icon={<BackIcon size={16} />}
                onClick={() => setTourStage(Math.max(0, stageIndex - 1))}
                disabled={stageIndex === 0}
              >
                Back
              </ToolbarButton>
              <ToolbarButton
                compact
                variant={paused ? 'primary' : 'ghost'}
                icon={paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
                onClick={() => (paused ? resumeTour() : pauseTour())}
              >
                {paused ? 'Resume tour' : 'Pause tour'}
              </ToolbarButton>
              <ToolbarButton
                compact
                icon={<ForwardIcon size={16} />}
                onClick={() => setTourStage(stageIndex + 1)}
                disabled={stageIndex >= TOUR_STAGES.length - 1}
              >
                Skip
              </ToolbarButton>
              <ToolbarButton compact variant="danger" icon={<CloseIcon size={16} />} onClick={exitTour}>
                Exit tour
              </ToolbarButton>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}