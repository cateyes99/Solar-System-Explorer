import { useSimulationStore } from '../../store/simulationStore'
import { RANDOM_FACTS } from '../../data/facts'

export function FactCard() {
  const factIndex = useSimulationStore((s) => s.factIndex)
  const showFact = useSimulationStore((s) => s.showFact)
  if (factIndex === null) return null

  return (
    <div className="fact-overlay" role="dialog" aria-modal="true" aria-label="Astronomy fact" onClick={() => showFact(null)}>
      <div className="fact-card glass" onClick={(e) => e.stopPropagation()}>
        <div className="fact-sparkle" aria-hidden>✨</div>
        <h2>Did you know?</h2>
        <p>{RANDOM_FACTS[factIndex]}</p>
        <div className="fact-actions">
          <button onClick={() => showFact(Math.floor(Math.random() * RANDOM_FACTS.length))}>Another one!</button>
          <button onClick={() => showFact(null)}>Close</button>
        </div>
      </div>
    </div>
  )
}
