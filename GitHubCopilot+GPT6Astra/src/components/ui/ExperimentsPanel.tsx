import { useTranslation } from 'react-i18next'
import { FlaskConical, RotateCcw, X } from 'lucide-react'
import { useSimulation, type Experiment } from '../../store/simulationStore'
import { IconButton } from './Controls'

const experiments: { id: Experiment; title: string; text: string }[] = [
  { id: 'two-moons', title: 'What if Earth had two moons?', text: 'A second, imaginary moon joins Earth. Two moons could make tides more complicated, but the details would depend on their masses and orbits. This example is not a stability prediction.' },
  { id: 'giant-earth', title: 'What if Earth were Jupiter-sized?', text: 'Earth grows to about 11 times its usual diameter, the size of Jupiter. At that diameter, its volume would be about 1,300 times greater. We are changing only its visual size, not its mass or gravity.' },
  { id: 'no-sun', title: 'What if the Sun disappeared?', text: 'This impossible thought experiment hides the Sun. Earth would not notice immediately: its sunlight and changes in gravity take about 8 minutes to arrive. Afterward, planets would move along their tangents, not keep orbiting. The paths shown here remain a reference, not a prediction.' },
  { id: 'no-spin', title: 'What if Earth stopped rotating?', text: 'Earth stops spinning in this illustration but still travels around the Sun. With no axial rotation, one day-night cycle would take a year. We leave out the enormous and destructive effects of any sudden stop.' },
]

export function ExperimentsPanel() {
  const { t } = useTranslation()
  const panel = useSimulation(state => state.panel)
  const active = useSimulation(state => state.experiment)
  if (panel !== 'experiments') return null
  const experiment = experiments.find(item => item.id === active)
  return <aside className="side-panel experiments-panel" aria-label={t("What if experiments")}><div className="panel-top"><span className="eyebrow"><FlaskConical size={13} /> {t("THE CURIOSITY LAB")}</span><IconButton label={t("Close experiments")} onClick={() => useSimulation.getState().set({ panel: null })}><X size={17} /></IconButton></div><h2>{t("A universe of what-ifs.")}</h2><p className="body-description">{t("Change one thing. See your solar system differently.")}</p><div className="experiment-options">{experiments.map((item, index) => <button key={item.id} className={active === item.id ? 'active' : ''} aria-pressed={active === item.id} onClick={() => { const state = useSimulation.getState(); state.set({ experiment: item.id, selected: item.id === 'no-sun' || item.id === 'giant-earth' ? null : 'earth', cameraMode: item.id === 'no-sun' || item.id === 'giant-earth' ? 'system' : 'follow', cameraRevision: state.cameraRevision + 1 }) }}><span>0{index + 1}</span>{t(item.title)}<span className="experiment-radio" /></button>)}</div>{experiment && <div className="experiment-explanation" aria-live="polite"><p>{t(experiment.text)}</p></div>}<div className="simulation-disclaimer"><FlaskConical size={15} /><span>{t("EDUCATIONAL SIMULATION")}<small>{t("Hypothetical illustrations, not real predictions.")}</small></span></div><button className="lesson-action" onClick={() => { useSimulation.getState().set({ experiment: 'none' }); useSimulation.getState().viewSystem() }}><RotateCcw size={14} />{t("Restore our solar system")}</button></aside>
}