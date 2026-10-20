import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { TOUR_STEPS } from '../../data/tour'
import { useSimulationStore } from '../../store/simulationStore'
import { audio } from '../../utils/audio'
import { Icon } from './Icon'

const TICK_MS = 100

/** Narration card and controls for the Cinematic Tour. */
export function TourControls() {
  const active = useSimulationStore((s) => s.appMode === 'tour')
  const stepIndex = useSimulationStore((s) => s.tourStep)
  const paused = useSimulationStore((s) => s.tourPaused)
  const setTourStep = useSimulationStore((s) => s.setTourStep)
  const setTourPaused = useSimulationStore((s) => s.setTourPaused)
  const exitTour = useSimulationStore((s) => s.exitTour)
  const elapsedRef = useRef(0)
  const [elapsed, setElapsed] = useState(0)
  const step = TOUR_STEPS[Math.min(stepIndex, TOUR_STEPS.length - 1)]

  useEffect(() => {
    elapsedRef.current = 0
    setElapsed(0)
    const { sound } = useSimulationStore.getState()
    if (active && step.id === 'jupiter' && sound.enabled && sound.cinematic) audio.cinematic('reveal')
  }, [stepIndex, active, step.id])

  useEffect(() => {
    if (!active || paused) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      elapsedRef.current += (now - last) / 1000
      last = now
      setElapsed(elapsedRef.current)
      if (elapsedRef.current >= step.seconds) {
        window.clearInterval(id)
        useSimulationStore.getState().setTourStep(useSimulationStore.getState().tourStep + 1)
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [active, paused, step.seconds, stepIndex])

  return (
    <AnimatePresence>
      {active && (
        <motion.section
          aria-label="Cinematic tour"
          className="glass pointer-events-auto fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 rounded-3xl p-5 sm:p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-cyan-200 uppercase">
            <Icon name="film" size={16} /> Cinematic Tour · Stop {stepIndex + 1} of {TOUR_STEPS.length}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45 }}
              aria-live="polite"
            >
              <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">{step.title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-200 sm:text-base">{step.narration}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex gap-1" aria-hidden="true">
            {TOUR_STEPS.map((s, i) => (
              <div key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-300 to-violet-300"
                  style={{ width: i < stepIndex ? '100%' : i === stepIndex ? `${Math.min(100, (elapsed / step.seconds) * 100)}%` : '0%' }}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary" onClick={() => setTourPaused(!paused)} data-autofocus>
              <Icon name={paused ? 'play' : 'pause'} size={18} /> {paused ? 'Resume' : 'Pause tour'}
            </button>
            <button type="button" className="btn" onClick={() => setTourStep(stepIndex - 1)} disabled={stepIndex === 0} aria-label="Previous stop">
              <Icon name="chevronLeft" size={18} /> Back
            </button>
            <button type="button" className="btn" onClick={() => setTourStep(stepIndex + 1)}>
              <Icon name="skip" size={16} /> Skip
            </button>
            <button type="button" className="btn ml-auto" onClick={exitTour}>
              <Icon name="close" size={18} /> Exit tour
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
