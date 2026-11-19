import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Pause, Play, SkipForward, X } from 'lucide-react'
import { TOUR_STOPS } from '../../data/tour'
import { useSimulationStore } from '../../store/simulationStore'

export function TourControls() {
  const active = useSimulationStore((state) => state.tourActive)
  const paused = useSimulationStore((state) => state.tourPaused)
  const step = useSimulationStore((state) => state.tourStep)
  const setPaused = useSimulationStore((state) => state.setTourPaused)
  const setStep = useSimulationStore((state) => state.setTourStep)
  const exitTour = useSimulationStore((state) => state.exitTour)
  const viewSystem = useSimulationStore((state) => state.viewSystem)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const stop = TOUR_STOPS[step]

  useEffect(() => {
    if (!active || !stop) return
    useSimulationStore.setState({ selectedBody: stop.body, cameraMode: stop.body ? 'follow' : 'system' })
    if (paused) return
    const timer = window.setTimeout(() => {
      if (step < TOUR_STOPS.length - 1) setStep(step + 1)
      else { exitTour(); viewSystem() }
    }, reducedMotion ? stop.duration * 0.65 : stop.duration)
    return () => window.clearTimeout(timer)
  }, [active, paused, step, stop, setStep, exitTour, viewSystem, reducedMotion])

  if (!active || !stop) return null
  const finish = () => { exitTour(); viewSystem() }
  const skip = () => step < TOUR_STOPS.length - 1 ? setStep(step + 1) : finish()

  return (
    <AnimatePresence>
      <motion.section className="tour-controls glass" aria-label="Cinematic tour controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="tour-progress"><i style={{ width: `${((step + 1) / TOUR_STOPS.length) * 100}%` }} /></div>
        <div className="tour-controls__top"><span><Compass size={14} />CINEMATIC TOUR</span><small>{String(step + 1).padStart(2, '0')} / {TOUR_STOPS.length}</small><button className="icon-button" onClick={finish} aria-label="Exit cinematic tour"><X size={17} /></button></div>
        <AnimatePresence mode="wait">
          <motion.div className="tour-narration" key={step} initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <span className="eyebrow">{stop.eyebrow}</span><h2>{stop.title}</h2><p>{stop.narration}</p>
          </motion.div>
        </AnimatePresence>
        <div className="tour-buttons"><button onClick={() => setPaused(!paused)}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? 'Resume tour' : 'Pause tour'}</button><button onClick={skip}><SkipForward size={15} />{step === TOUR_STOPS.length - 1 ? 'Finish' : 'Skip stop'}</button><button onClick={finish}>Exit tour</button></div>
      </motion.section>
    </AnimatePresence>
  )
}
