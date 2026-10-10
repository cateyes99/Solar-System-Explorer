import { useSimulationStore, TOUR_STAGES } from '../../store/simulationStore'

export function TourControls() {
  const tourActive = useSimulationStore((s) => s.tourActive)
  const tourIndex = useSimulationStore((s) => s.tourIndex)
  const tourPaused = useSimulationStore((s) => s.tourPaused)
  const toggleTourPaused = useSimulationStore((s) => s.toggleTourPaused)
  const setTourIndex = useSimulationStore((s) => s.setTourIndex)
  const stopTour = useSimulationStore((s) => s.stopTour)

  if (!tourActive) return null
  const stage = TOUR_STAGES[tourIndex]

  return (
    <div className="tour-box glass" role="status" aria-live="polite">
      <div className="tour-progress">
        Stage {tourIndex + 1} / {TOUR_STAGES.length}
      </div>
      <p className="tour-text">{stage?.text}</p>
      <div className="tour-actions">
        <button onClick={toggleTourPaused}>{tourPaused ? '▶ Resume' : '⏸ Pause'}</button>
        <button onClick={() => setTourIndex(Math.min(tourIndex + 1, TOUR_STAGES.length - 1))}>⏭ Skip</button>
        <button onClick={stopTour}>✕ Exit tour</button>
      </div>
    </div>
  )
}
