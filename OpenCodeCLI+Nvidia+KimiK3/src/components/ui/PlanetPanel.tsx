import { useSimulationStore } from '../../store/simulationStore'
import { PLANETS } from '../../data/planets'
import { formatKm } from '../../utils/scale'

export function PlanetPanel() {
  const selectedId = useSimulationStore((s) => s.selectedPlanetId)
  const select = useSimulationStore((s) => s.select)
  const cameraMode = useSimulationStore((s) => s.cameraMode)
  const setCameraMode = useSimulationStore((s) => s.setCameraMode)

  const planet = PLANETS.find((p) => p.id === selectedId)
  if (!planet) return null

  const helloEarth = planet.id === 'earth'

  return (
    <aside className="planet-panel glass" role="dialog" aria-label={`${planet.name} information`}>
      <button className="close-btn" onClick={() => select(null)} aria-label="Close planet information">×</button>
      <h2 style={{ color: planet.color }}>{planet.name}</h2>
      {helloEarth && <p className="hello-earth">👋 Hello, Earth!</p>}
      <p className="planet-type">{planet.type}</p>
      <p className="planet-desc">{planet.description}</p>

      <dl className="planet-stats">
        <div><dt>Diameter</dt><dd>{planet.diameterKm.toLocaleString()} km</dd></div>
        <div><dt>Distance from Sun</dt><dd>{formatKm(planet.distanceFromSunKm)}</dd></div>
        <div><dt>Year length</dt><dd>{planet.orbitalPeriodDays.toLocaleString()} days</dd></div>
        <div><dt>Day length</dt><dd>{Math.abs(planet.rotationPeriodHours).toLocaleString()} hours</dd></div>
        <div><dt>Moons</dt><dd>{planet.moons}</dd></div>
        <div><dt>Avg. temperature</dt><dd>{planet.temperatureC}°C</dd></div>
      </dl>

      <h3>Cool facts</h3>
      <ul>
        {planet.facts.map((f) => <li key={f}>{f}</li>)}
      </ul>

      <div className="did-you-know">
        <strong>💡 Did you know?</strong>
        <p>{planet.didYouKnow}</p>
      </div>

      <div className="panel-actions">
        <button
          className={cameraMode === 'follow' ? 'active' : ''}
          onClick={() => setCameraMode(cameraMode === 'follow' ? 'planet' : 'follow')}
        >
          {cameraMode === 'follow' ? '⏸ Stop Following' : '🛰 Follow Planet'}
        </button>
        <button onClick={() => { select(null); setCameraMode('system') }}>🌌 View Solar System</button>
      </div>
    </aside>
  )
}
