import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair, Minus, Navigation, Orbit, Plus, Rocket, X } from 'lucide-react'
import { BODY_DATA } from '../../data/planets'
import type { BodyId } from '../../types'
import { useSimulationStore } from '../../store/simulationStore'
import { setFlightInput, useMissionStore } from '../../store/missionStore'
import type { FlightControl } from '../../store/missionStore'

const destinations = Object.values(BODY_DATA).filter((body) => body.id !== 'sun' && body.id !== 'moon')

function FlightButton({ control, label, children }: { control: FlightControl; label: string; children: React.ReactNode }) {
  return (
    <button
      className="flight-key"
      aria-label={label}
      onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setFlightInput(control, true) }}
      onPointerUp={() => setFlightInput(control, false)}
      onPointerCancel={() => setFlightInput(control, false)}
      onLostPointerCapture={() => setFlightInput(control, false)}
    >{children}</button>
  )
}

export function MissionControl() {
  const active = useSimulationStore((state) => state.missionActive)
  const setActive = useSimulationStore((state) => state.setMissionActive)
  const cameraMode = useSimulationStore((state) => state.cameraMode)
  const setCameraMode = useSimulationStore((state) => state.setCameraMode)
  const speed = useMissionStore((state) => state.speed)
  const distance = useMissionStore((state) => state.distanceFromSun)
  const destination = useMissionStore((state) => state.destination)
  const autopilot = useMissionStore((state) => state.autopilot)
  const followOrbit = useMissionStore((state) => state.followOrbit)
  const setDestination = useMissionStore((state) => state.setDestination)
  const setAutopilot = useMissionStore((state) => state.setAutopilot)
  const setFollowOrbit = useMissionStore((state) => state.setFollowOrbit)
  if (!active) return null

  return (
    <aside className="mission-control glass" aria-label="Spacecraft mission control">
      <header><span className="mission-icon"><Rocket size={18} /></span><div><span className="eyebrow">ASTRA–01</span><h2>Mission Control</h2></div><button className="icon-button" onClick={() => setActive(false)} aria-label="Exit spacecraft mode"><X size={17} /></button></header>
      <div className="mission-status"><span className="status-dot" /><span>SPACECRAFT ONLINE</span><small>EDU FLIGHT MODEL</small></div>
      <div className="telemetry"><div><span>SPEED</span><strong>{speed.toFixed(1)} <small>u/s</small></strong></div><div><span>DISTANCE FROM SUN</span><strong>{(distance / 16.8).toFixed(2)} <small>AU*</small></strong></div></div>
      <label className="destination-select"><span>CURRENT DESTINATION</span><div><Navigation size={15} /><select value={destination} onChange={(event) => { setDestination(event.target.value as BodyId); setAutopilot(true) }}>{destinations.map((body) => <option key={body.id} value={body.id}>{body.name}</option>)}</select></div></label>
      <div className="autopilot-actions"><button className={autopilot && !followOrbit ? 'active' : ''} onClick={() => setAutopilot(!autopilot)}><Navigation size={15} />{autopilot && !followOrbit ? 'Autopilot engaged' : 'Engage autopilot'}</button><button className={followOrbit ? 'active' : ''} onClick={() => setFollowOrbit(!followOrbit)} title="Follow an orbit around your destination"><Orbit size={16} /></button></div>
      <div className="flight-pad"><div className="flight-pad__grid"><span /><FlightButton control="forward" label="Fly forward"><ArrowUp size={18} /></FlightButton><span /><FlightButton control="left" label="Fly left"><ArrowLeft size={18} /></FlightButton><FlightButton control="backward" label="Fly backward"><ArrowDown size={18} /></FlightButton><FlightButton control="right" label="Fly right"><ArrowRight size={18} /></FlightButton></div><div className="vertical-keys"><FlightButton control="up" label="Fly up"><Plus size={17} /></FlightButton><FlightButton control="down" label="Fly down"><Minus size={17} /></FlightButton></div><FlightButton control="boost" label="Boost speed"><span>BOOST</span></FlightButton></div>
      <p className="flight-hint">WASD to move · Q/E down/up · Shift to boost</p>
      <button className="track-ship" onClick={() => setCameraMode(cameraMode === 'spacecraft' ? 'system' : 'spacecraft')}><Crosshair size={15} />{cameraMode === 'spacecraft' ? 'Release camera' : 'Track spacecraft'}</button>
      <p className="panel-footnote">*AU is estimated from visual scene spacing, not a navigation measurement. Flight is intentionally simplified.</p>
    </aside>
  )
}
