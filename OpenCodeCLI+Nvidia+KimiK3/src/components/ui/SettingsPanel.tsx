import { useSimulationStore } from '../../store/simulationStore'
import type { ScaleMode } from '../../utils/scale'

const SCALE_OPTIONS: { id: ScaleMode; label: string; hint: string }[] = [
  { id: 'educational', label: 'Educational', hint: 'Balanced sizes & distances — easy to explore' },
  { id: 'relative', label: 'Relative Size', hint: 'Planet sizes true to each other' },
  { id: 'distance', label: 'Distances Emphasized', hint: 'Shows how far apart planets really are' },
  { id: 'custom', label: 'Custom', hint: 'Adjust sizes and distances yourself' },
]

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const setScaleMode = useSimulationStore((s) => s.setScaleMode)
  const customSize = useSimulationStore((s) => s.customSize)
  const setCustomSize = useSimulationStore((s) => s.setCustomSize)
  const customDistance = useSimulationStore((s) => s.customDistance)
  const setCustomDistance = useSimulationStore((s) => s.setCustomDistance)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const toggleLabels = useSimulationStore((s) => s.toggleLabels)
  const showOrbits = useSimulationStore((s) => s.showOrbits)
  const toggleOrbits = useSimulationStore((s) => s.toggleOrbits)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const toggleReducedMotion = useSimulationStore((s) => s.toggleReducedMotion)

  if (!open) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel glass" role="dialog" aria-modal="true" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close settings">×</button>
        <h2>Settings</h2>

        <section>
          <h3>Scale Mode</h3>
          <p className="scale-note">This visualization is not physically to scale — real space is far too big and empty to show nicely!</p>
          <div className="scale-options" role="radiogroup" aria-label="Scale mode">
            {SCALE_OPTIONS.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={scaleMode === o.id}
                className={scaleMode === o.id ? 'active' : ''}
                onClick={() => setScaleMode(o.id)}
                title={o.hint}
              >
                {o.label}
              </button>
            ))}
          </div>
          {scaleMode === 'custom' && (
            <div className="custom-sliders">
              <label>
                Planet size
                <input type="range" min={0.5} max={2} step={0.05} value={customSize} onChange={(e) => setCustomSize(Number(e.target.value))} />
              </label>
              <label>
                Orbit distance
                <input type="range" min={0.6} max={1.6} step={0.05} value={customDistance} onChange={(e) => setCustomDistance(Number(e.target.value))} />
              </label>
            </div>
          )}
        </section>

        <section className="toggles">
          <label><input type="checkbox" checked={showLabels} onChange={toggleLabels} /> Planet labels</label>
          <label><input type="checkbox" checked={showOrbits} onChange={toggleOrbits} /> Orbit lines</label>
          <label><input type="checkbox" checked={reducedMotion} onChange={toggleReducedMotion} /> Reduce motion</label>
        </section>
      </div>
    </div>
  )
}
