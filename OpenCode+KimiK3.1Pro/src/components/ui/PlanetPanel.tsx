import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, Lightbulb, Orbit, X } from 'lucide-react'
import { BODY_DATA } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { formatDay, formatDistance, formatNumber, formatYear } from '../../utils/scale'

export function PlanetPanel() {
  const selectedBody = useSimulationStore((state) => state.selectedBody)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const cameraMode = useSimulationStore((state) => state.cameraMode)
  const setCameraMode = useSimulationStore((state) => state.setCameraMode)
  const tourActive = useSimulationStore((state) => state.tourActive)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const body = selectedBody ? BODY_DATA[selectedBody] : null

  return (
    <AnimatePresence>
      {body && !tourActive && (
        <motion.aside
          className="planet-panel glass"
          aria-label={`${body.name} information`}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className="planet-panel__close icon-button" onClick={() => selectBody(null)} aria-label="Close planet information"><X size={18} /></button>
          <div className="planet-panel__hero">
            <div className={`planet-portrait planet-portrait--${body.id}`} style={{ '--planet-color': body.color, '--planet-accent': body.accentColor } as React.CSSProperties}><i /></div>
            <span className="eyebrow">DESTINATION PROFILE · {body.id === 'sun' ? '00' : body.id === 'moon' ? '03B' : String(Object.keys(BODY_DATA).indexOf(body.id) - 1).padStart(2, '0')}</span>
            <h2>{body.name}</h2>
            <p className="planet-type"><span style={{ background: body.accentColor }} />{body.type}</p>
          </div>
          <p className="planet-description">{body.description}</p>
          <div className="camera-actions">
            <button className={cameraMode === 'planet' ? 'active' : ''} onClick={() => setCameraMode('planet')}><Crosshair size={15} />View {body.id === 'moon' ? 'Moon' : 'planet'}</button>
            <button className={cameraMode === 'follow' ? 'active' : ''} onClick={() => setCameraMode('follow')}><Orbit size={15} />Follow</button>
          </div>
          <div className="planet-stats">
            <div><span>DIAMETER</span><strong>{formatNumber(body.diameterKm)} <small>km</small></strong></div>
            <div><span>DISTANCE FROM SUN</span><strong>{formatDistance(body.distanceFromSunKm)}</strong></div>
            <div><span>LENGTH OF YEAR</span><strong>{formatYear(body.orbitalPeriodDays)}</strong></div>
            <div><span>LENGTH OF DAY</span><strong>{formatDay(body.rotationPeriodHours)}</strong></div>
            <div><span>MOONS</span><strong>{body.id === 'sun' ? '8 planets instead!' : body.moons}</strong></div>
            <div><span>TEMPERATURE</span><strong>{body.temperatureC.toLocaleString()}°C <small>avg.</small></strong></div>
          </div>
          <section className="planet-facts"><h3>Field notes</h3>{body.facts.map((fact, index) => <div key={fact}><span>{String(index + 1).padStart(2, '0')}</span><p>{fact}</p></div>)}</section>
          <section className="did-you-know"><Lightbulb size={19} /><div><h3>Did you know?</h3><p>{body.didYouKnow}</p></div></section>
          <p className="data-note">Real astronomy data, rounded for clarity. Moon counts change as new discoveries are confirmed.</p>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
