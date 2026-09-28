import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Navigation, Orbit, Rocket, RotateCcw, X } from 'lucide-react'
import { bodyById, planets } from '../../data/planets'
import { useSimulation } from '../../store/simulationStore'
import { flight } from '../../store/flightState'
import { IconButton } from './Controls'

export function MissionPanel() {
  const { t, i18n } = useTranslation()
  const panel = useSimulation(state => state.panel)
  const active = useSimulation(state => state.missionActive)
  const destination = useSimulation(state => state.missionDestination)
  const [telemetry, setTelemetry] = useState({ ...flight })
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setTelemetry({ ...flight }), 200)
    return () => clearInterval(timer)
  }, [active])
  if (panel !== 'mission') return null
  const controls = [
    { label: 'Turn left', icon: ArrowLeft, key: 'steer', value: 1 },
    { label: 'Accelerate spacecraft', icon: ArrowUp, key: 'thrust', value: 1 },
    { label: 'Turn right', icon: ArrowRight, key: 'steer', value: -1 },
    { label: 'Reverse spacecraft', icon: ArrowDown, key: 'thrust', value: -1 },
  ] as const
  return <aside className="side-panel mission-panel" aria-label={t("Mission Control")}>
    <div className="panel-top"><span className="eyebrow"><Rocket size={13} /> {t("MISSION CONTROL")}</span><IconButton label={t("Close mission control")} onClick={() => useSimulation.getState().set({ panel: null, thrust: 0, steer: 0 })}><X size={17} /></IconButton></div>
    <h2>{t("Your next frontier.")}</h2>
    <div className="mission-ship"><Rocket size={50} strokeWidth={1} /><span>{t("EXPLORER 01")}<small>{t("RESEARCH VESSEL")}</small></span></div>
    <label className="range-label" htmlFor="mission-destination">{t("Destination")}</label>
    <select id="mission-destination" value={destination} onChange={event => { useSimulation.getState().set({ missionDestination: event.target.value as typeof destination }); flight.autoPilot = true; flight.orbitPath = false; flight.arrived = false }}>{planets.map(body => <option key={body.id} value={body.id}>{t(body.name)}</option>)}</select>
    <div className="mission-telemetry"><div><span>{t("Speed")}</span><strong>{telemetry.speed.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}<small>{t("scene units / sec")}</small></strong></div><div><span>{t("From Sun")}</span><strong>{telemetry.distance.toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })}<small>{t("Earth-orbit radii")}</small></strong></div></div>
    {!active ? <button className="launch-button" onClick={() => { const state = useSimulation.getState(); state.set({ missionActive: true, missionReset: state.missionReset + 1, cameraMode: 'system', selected: null, cameraRevision: state.cameraRevision + 1, paused: false }); flight.autoPilot = true }}><Rocket size={16} />{t("Launch mission")}</button> : <>
      <div className={`mission-status ${telemetry.arrived ? 'arrived' : ''}`} role="status">{telemetry.arrived ? <Check size={16} /> : <Navigation size={16} />}<span>{telemetry.orbitPath ? t("Following {{value1}}'s orbital path", { value1: t(bodyById[destination].name) }) : telemetry.arrived ? t("Arrived near {{value1}}", { value1: t(bodyById[destination].name) }) : t(telemetry.autoPilot ? 'Autopilot to {{destination}}' : 'Manual flight near {{destination}}', { destination: t(bodyById[destination].name) })}</span></div>
      <div className="flight-controls" aria-label={t("Spacecraft controls")}>{controls.map(control => <IconButton key={control.label} label={t(control.label)} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); useSimulation.getState().set({ [control.key]: control.value }) }} onPointerUp={() => useSimulation.getState().set({ [control.key]: 0 })} onPointerCancel={() => useSimulation.getState().set({ [control.key]: 0 })} onLostPointerCapture={() => useSimulation.getState().set({ [control.key]: 0 })} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') useSimulation.getState().set({ [control.key]: control.value }) }} onKeyUp={() => useSimulation.getState().set({ [control.key]: 0 })} onBlur={() => useSimulation.getState().set({ [control.key]: 0 })}><control.icon size={20} /></IconButton>)}</div>
      <div className="mission-actions"><button className="secondary-button" onClick={() => { flight.autoPilot = true; flight.orbitPath = false }}><Navigation size={14} />{t("Autopilot")}</button><button className="secondary-button" onClick={() => { flight.autoPilot = true; flight.orbitPath = true }}><Orbit size={14} />{t("Follow orbit")}</button></div>
      <button className="lesson-action" onClick={() => { const state = useSimulation.getState(); state.set({ selected: destination, cameraMode: 'follow', cameraRevision: state.cameraRevision + 1 }) }}><Navigation size={14} />{t("View destination")}</button>
      <button className="lesson-action" onClick={() => { useSimulation.getState().set({ missionActive: false, thrust: 0, steer: 0 }); flight.speed = 0 }}><RotateCcw size={14} />{t("End mission")}</button>
    </>}
    <p className="data-note">{t("An arcade-style educational flight model. Distances and speeds use the scene's compressed scale, not real spacecraft physics. Motion pauses with the cosmic clock or Reduce Motion.")}</p>
  </aside>
}