import { MousePointer2 } from 'lucide-react'
import { PLANETS, SUN } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'

export function PlanetNavigator() {
  const selectedBody = useSimulationStore((state) => state.selectedBody)
  const selectBody = useSimulationStore((state) => state.selectBody)
  return (
    <aside className="destination-rail" aria-label="Choose a destination">
      <div className="rail-heading"><span>DESTINATIONS</span><small>09</small></div>
      <div className="destination-list">
        {[SUN, ...PLANETS].map((body, index) => (
          <button
            key={body.id}
            className={`destination ${selectedBody === body.id ? 'active' : ''}`}
            onClick={() => selectBody(body.id, true)}
            aria-pressed={selectedBody === body.id}
            aria-label={`Visit ${body.name}`}
          >
            <span className="destination__index">{String(index).padStart(2, '0')}</span>
            <span className={`mini-planet mini-planet--${body.id}`} style={{ '--planet-color': body.color } as React.CSSProperties} />
            <span className="destination__name">{body.name.replace('The ', '')}</span>
            <span className="destination__line" />
          </button>
        ))}
      </div>
      <div className="rail-hint"><MousePointer2 size={13} /><span>Double-click<br />a world to visit</span></div>
    </aside>
  )
}
