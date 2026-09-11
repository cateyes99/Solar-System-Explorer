import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulation } from '../../store/simulationStore'
import { TOUR_STEPS } from '../../data/tour'
import { audio } from '../../audio/audioEngine'
import type { BodyId } from '../../types'

function applyStep(index: number): void {
  const step = TOUR_STEPS[index]
  const store = useSimulation.getState()
  store.focusTourTarget(step.target === 'system' ? null : (step.target as BodyId), step.distance)
}

/** Cinematic tour runner + narration card with pause/resume/skip/exit. */
export function TourControls(): JSX.Element {
  const tourActive = useSimulation((s) => s.tourActive)
  const tourPaused = useSimulation((s) => s.tourPaused)
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const setTourPaused = useSimulation((s) => s.setTourPaused)
  const stopTour = useSimulation((s) => s.stopTour)
  const [step, setStep] = useState(0)

  // (Re)start the tour from the beginning whenever it becomes active.
  useEffect(() => {
    if (tourActive) {
      setStep(0)
      applyStep(0)
      audio.whoosh()
    }
  }, [tourActive])

  // Advance automatically; pause freezes the timer.
  useEffect(() => {
    if (!tourActive || tourPaused) return
    const duration = TOUR_STEPS[step].durationMs * (reduceMotion ? 0.75 : 1)
    const timer = window.setTimeout(() => {
      if (step < TOUR_STEPS.length - 1) {
        setStep(step + 1)
        applyStep(step + 1)
        audio.whoosh()
      } else {
        stopTour()
      }
    }, duration)
    return () => window.clearTimeout(timer)
  }, [tourActive, tourPaused, step, reduceMotion, stopTour])

  const current = TOUR_STEPS[step]

  return (
    <AnimatePresence>
      {tourActive && (
        <motion.div
          key="tour"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="glass fixed bottom-36 left-1/2 z-40 w-[min(600px,94vw)] -translate-x-1/2 rounded-2xl p-4 max-md:bottom-32"
          role="region"
          aria-label="Cinematic tour"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="font-display text-sm font-bold tracking-wide text-astro-cyan">
                    {step + 1}/{TOUR_STEPS.length} · {current.title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-white/85">{current.text}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-1 gap-1" aria-hidden>
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-astro-blue' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              className="btn max-md:px-2.5"
              onClick={() => setTourPaused(!tourPaused)}
              aria-label={tourPaused ? 'Resume tour' : 'Pause tour'}
            >
              {tourPaused ? '▶' : '⏸'}
            </button>
            <button
              type="button"
              className="btn max-md:px-2.5"
              onClick={() => {
                const next = Math.min(step + 1, TOUR_STEPS.length - 1)
                setStep(next)
                applyStep(next)
                audio.whoosh()
              }}
              aria-label="Skip to next stop"
            >
              ▸▸
            </button>
            <button type="button" className="btn max-md:px-2.5" onClick={stopTour} aria-label="Exit tour">
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
