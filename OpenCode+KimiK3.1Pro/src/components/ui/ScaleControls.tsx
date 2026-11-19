import { Check, Info, Maximize2, Ruler } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { SCALE_LABELS } from '../../utils/scale'
import type { ScaleMode } from '../../types'
import { Modal } from './Modal'

export function ScaleButton() {
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const setActiveModal = useSimulationStore((state) => state.setActiveModal)
  return (
    <button className="scale-button glass" onClick={() => setActiveModal('scale')} aria-label="Change visualization scale">
      <span className="scale-button__icon"><Maximize2 size={17} /></span>
      <span><small>VISUALIZATION SCALE</small><strong>{SCALE_LABELS[scaleMode].name}</strong></span>
      <Ruler size={16} />
    </button>
  )
}

export function ScalePanel() {
  const activeModal = useSimulationStore((state) => state.activeModal)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const setScaleMode = useSimulationStore((state) => state.setScaleMode)
  const customSize = useSimulationStore((state) => state.customSize)
  const customDistance = useSimulationStore((state) => state.customDistance)
  const setCustomScale = useSimulationStore((state) => state.setCustomScale)
  const modes = Object.keys(SCALE_LABELS) as ScaleMode[]

  return (
    <Modal open={activeModal === 'scale'} title="Choose your perspective" eyebrow="EDUCATIONAL SCALE" size="small">
      <div className="scale-explainer"><Info size={17} /><p>This visualization is <strong>not to physical scale.</strong> Each mode makes a different kind of comparison easier.</p></div>
      <div className="scale-modes">
        {modes.map((mode) => (
          <button key={mode} className={scaleMode === mode ? 'active' : ''} onClick={() => setScaleMode(mode)} aria-pressed={scaleMode === mode}>
            <span><strong>{SCALE_LABELS[mode].name}</strong><small>{SCALE_LABELS[mode].description}</small></span>
            <i>{scaleMode === mode && <Check size={14} />}</i>
          </button>
        ))}
      </div>
      {scaleMode === 'custom' && (
        <div className="custom-sliders">
          <label><span>Planet size <strong>{customSize.toFixed(1)}×</strong></span><input type="range" min="0.5" max="1.8" step="0.1" value={customSize} onChange={(event) => setCustomScale(Number(event.target.value), customDistance)} /></label>
          <label><span>Orbital spacing <strong>{customDistance.toFixed(1)}×</strong></span><input type="range" min="0.7" max="1.5" step="0.1" value={customDistance} onChange={(event) => setCustomScale(customSize, Number(event.target.value))} /></label>
        </div>
      )}
      <p className="panel-footnote">Orbits are simplified as circles. Sizes, distances, and time are independently adjusted for learning.</p>
    </Modal>
  )
}
