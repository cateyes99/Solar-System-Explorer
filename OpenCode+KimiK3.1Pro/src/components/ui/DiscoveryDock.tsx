import { Compass, Play, Shuffle, Sparkles } from 'lucide-react'
import { PLANETS } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'

export function DiscoveryDock() {
  const startTour = useSimulationStore((state) => state.startTour)
  const nextFact = useSimulationStore((state) => state.nextFact)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const showToast = useSimulationStore((state) => state.showToast)
  const tourActive = useSimulationStore((state) => state.tourActive)
  const missionActive = useSimulationStore((state) => state.missionActive)
  const selectedBody = useSimulationStore((state) => state.selectedBody)

  if (tourActive || missionActive || selectedBody) return null
  const surprise = () => {
    const planet = PLANETS[Math.floor(Math.random() * PLANETS.length)]
    selectBody(planet.id, true)
    showToast(`Surprise destination: ${planet.name}. Let’s see what makes it special!`)
  }

  return (
    <aside className="discovery-dock" aria-label="Discovery activities">
      <span className="eyebrow">YOUR NEXT DISCOVERY</span>
      <button className="tour-card" onClick={startTour}>
        <span className="tour-card__icon"><Compass size={21} /></span>
        <span><strong>The grand tour</strong><small>11 worlds · one unforgettable journey</small></span>
        <span className="tour-card__play"><Play size={14} fill="currentColor" /></span>
      </button>
      <div className="discovery-actions">
        <button onClick={nextFact}><Sparkles size={15} /><span>Teach me something!</span></button>
        <button onClick={surprise} aria-label="Surprise me with a random planet" title="Surprise me"><Shuffle size={15} /></button>
      </div>
    </aside>
  )
}
