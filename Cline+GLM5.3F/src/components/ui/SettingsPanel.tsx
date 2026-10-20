import { Panel } from './Panel'
import { useSimulation } from '../../store/simulationStore'
import { getLayout } from '../../utils/scale'
import { audio } from '../../audio/audioEngine'
import type { ScaleMode } from '../../types'

const MODES: Array<{ id: ScaleMode; label: string; emoji: string }> = [
  { id: 'educational', label: 'Educational', emoji: '🎓' },
  { id: 'relative', label: 'Relative Size', emoji: '⚖️' },
  { id: 'distances', label: 'Distances', emoji: '📏' },
  { id: 'custom', label: 'Custom', emoji: '🎛️' },
]

interface ToggleProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, hint, checked, onChange }: ToggleProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.08]"
    >
      <span>
        <span className="block text-sm font-medium text-white/90">{label}</span>
        {hint && <span className="block text-[11px] leading-snug text-white/45">{hint}</span>}
      </span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-astro-blue' : 'bg-white/20'}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

/** Settings: scale modes, view toggles, accessibility, sound and shortcuts. */
export function SettingsPanel(): JSX.Element {
  const open = useSimulation((s) => s.panel === 'settings')
  const setPanel = useSimulation((s) => s.setPanel)
  const scaleMode = useSimulation((s) => s.scaleMode)
  const setScaleMode = useSimulation((s) => s.setScaleMode)
  const customScale = useSimulation((s) => s.customScale)
  const setCustomScale = useSimulation((s) => s.setCustomScale)
  const showLabels = useSimulation((s) => s.showLabels)
  const showOrbits = useSimulation((s) => s.showOrbits)
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const soundOn = useSimulation((s) => s.soundOn)
  const toggle = useSimulation((s) => s.toggle)
  const surpriseCamera = useSimulation((s) => s.surpriseCamera)

  const note = getLayout(scaleMode, customScale).note

  return (
    <Panel open={open} title="Settings" emoji="⚙️" onClose={() => setPanel('none')}>
      <div className="space-y-5">
        <section>
          <h3 className="panel-title mb-2">Scale mode</h3>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Scale mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip justify-center !px-2 !py-2 ${scaleMode === m.id ? 'chip-active' : ''}`}
                onClick={() => {
                  setScaleMode(m.id)
                  audio.blip(760)
                }}
                aria-pressed={scaleMode === m.id}
              >
                <span aria-hidden>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-xl border border-astro-orange/25 bg-astro-orange/10 p-2.5 text-[12px] leading-snug text-white/75">
            ⚠️ {note}
          </p>
          {scaleMode === 'custom' && (
            <div className="mt-3 space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <label className="block">
                <span className="stat-label">Planet size ×{customScale.sizeExaggeration.toFixed(1)}</span>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={customScale.sizeExaggeration}
                  onChange={(e) => setCustomScale({ sizeExaggeration: Number(e.target.value) })}
                />
              </label>
              <label className="block">
                <span className="stat-label">Distance spread ×{customScale.distanceSpread.toFixed(1)}</span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={customScale.distanceSpread}
                  onChange={(e) => setCustomScale({ distanceSpread: Number(e.target.value) })}
                />
              </label>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="panel-title">View & accessibility</h3>
          <Toggle
            label="Planet labels"
            checked={showLabels}
            onChange={() => toggle('showLabels')}
            hint="Elegant floating names (shortcut: L)"
          />
          <Toggle
            label="Orbit paths"
            checked={showOrbits}
            onChange={() => toggle('showOrbits')}
            hint="Show the ring roads of the planets (shortcut: O)"
          />
          <Toggle
            label="Reduce motion"
            checked={reduceMotion}
            onChange={() => toggle('reduceMotion')}
            hint="Calms camera moves, twinkle and effects"
          />
          <Toggle
            label="Ambient sound"
            checked={soundOn}
            onChange={() => toggle('soundOn')}
            hint="Gentle space drone + soft UI sounds"
          />
        </section>

        <section className="space-y-2">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => {
              surpriseCamera()
              audio.whoosh()
            }}
          >
            🎲 Surprise me!
          </button>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[12px] leading-relaxed text-white/60">
            <p className="stat-label mb-1">Keyboard shortcuts</p>
            <p>
              <kbd className="text-white/85">Space</kbd> pause •{' '}
              <kbd className="text-white/85">Esc</kbd> back •{' '}
              <kbd className="text-white/85">L</kbd> labels •{' '}
              <kbd className="text-white/85">O</kbd> orbits •{' '}
              <kbd className="text-white/85">R</kbd> surprise view •{' '}
              <kbd className="text-white/85">F</kbd> full system
            </p>
          </div>
        </section>
      </div>
    </Panel>
  )
}
