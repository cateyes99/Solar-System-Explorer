import { Eye, Gauge, Keyboard, RotateCcw, Volume2 } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { Modal } from './Modal'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  label: string
  description: string
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="setting-row">
      <span><strong>{label}</strong><small>{description}</small></span>
      <button className={`switch ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={onChange}><i /></button>
    </div>
  )
}

export function SettingsPanel() {
  const activeModal = useSimulationStore((state) => state.activeModal)
  const showLabels = useSimulationStore((state) => state.showLabels)
  const toggleLabels = useSimulationStore((state) => state.toggleLabels)
  const showOrbits = useSimulationStore((state) => state.showOrbits)
  const toggleOrbits = useSimulationStore((state) => state.toggleOrbits)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const setReducedMotion = useSimulationStore((state) => state.setReducedMotion)
  const soundEnabled = useSimulationStore((state) => state.soundEnabled)
  const setSoundEnabled = useSimulationStore((state) => state.setSoundEnabled)
  const quality = useSimulationStore((state) => state.quality)
  const setQuality = useSimulationStore((state) => state.setQuality)
  const setActiveModal = useSimulationStore((state) => state.setActiveModal)
  const viewSystem = useSimulationStore((state) => state.viewSystem)

  return (
    <Modal open={activeModal === 'settings'} title="Mission settings" eyebrow="MAKE YOURSELF AT HOME" size="small">
      <div className="settings-section"><h3><Eye size={16} />Scene</h3>
        <Toggle checked={showLabels} onChange={toggleLabels} label="Planet labels" description="Show names beside each world" />
        <Toggle checked={showOrbits} onChange={toggleOrbits} label="Orbital paths" description="Reveal the planets’ simplified paths" />
      </div>
      <div className="settings-section"><h3><Gauge size={16} />Comfort & performance</h3>
        <Toggle checked={reducedMotion} onChange={() => setReducedMotion(!reducedMotion)} label="Reduce motion" description="Softer camera moves, slower effects, no automatic rotation" />
        <div className="quality-control"><span><strong>Graphics quality</strong><small>Adaptive resolution is used automatically</small></span><div>{(['auto', 'high', 'low'] as const).map((item) => <button key={item} className={quality === item ? 'active' : ''} onClick={() => setQuality(item)}>{item}</button>)}</div></div>
      </div>
      <div className="settings-section"><h3><Volume2 size={16} />Audio</h3><Toggle checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} label="Ambient space sound" description="A quiet synthesized soundscape · off by default" /></div>
      <div className="settings-links"><button onClick={() => setActiveModal('shortcuts')}><Keyboard size={16} />Keyboard shortcuts</button><button onClick={() => { setActiveModal(null); viewSystem() }}><RotateCcw size={16} />Reset camera view</button></div>
      <p className="panel-footnote">Astra uses procedural graphics and a simplified educational model. No account, tracking, or downloads required.</p>
    </Modal>
  )
}
