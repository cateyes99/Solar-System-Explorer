import { useSimulationStore } from '../../store/simulationStore'
import { SUN_INFO } from '../../data/planets'
import { RANDOM_FACTS } from '../../data/facts'

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const startTour = useSimulationStore((s) => s.startTour)
  const tourActive = useSimulationStore((s) => s.tourActive)
  const showFact = useSimulationStore((s) => s.showFact)
  const muted = useSimulationStore((s) => s.muted)
  const toggleMuted = useSimulationStore((s) => s.toggleMuted)

  return (
    <header className="header glass" role="banner">
      <div className="brand">
        <span className="brand-dot" aria-hidden />
        Solar System Explorer
      </div>
      <nav className="header-actions" aria-label="Main actions">
        <button onClick={() => showFact(Math.floor(Math.random() * RANDOM_FACTS.length))} aria-label="Teach me a random astronomy fact">
          ✨ Teach Me Something!
        </button>
        <button onClick={startTour} disabled={tourActive} aria-label="Start cinematic guided tour">
          🎬 Cinematic Tour
        </button>
        <button onClick={toggleMuted} aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={!muted}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button onClick={onOpenSettings} aria-label="Open settings">⚙️</button>
      </nav>
      <span className="sr-only">{SUN_INFO.name} facts available in planet panels.</span>
    </header>
  )
}
