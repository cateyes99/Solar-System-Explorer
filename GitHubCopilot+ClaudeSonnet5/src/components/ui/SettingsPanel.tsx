import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { SCALE_MODES } from '../../utils/scale'
import { CloseIcon } from './icons'
import { Toggle } from './Toggle'

const SHORTCUTS: Array<[string, string]> = [
  ['1 \u2013 8', 'Focus Mercury through Neptune'],
  ['0 / Esc', 'Return to full Solar System view'],
  ['Space', 'Play / pause time'],
  ['L', 'Toggle planet labels'],
]

/** Scale-mode picker, accessibility toggles, and a keyboard-shortcut legend. */
export function SettingsPanel() {
  const isSettingsOpen = useSimulationStore((s) => s.isSettingsOpen)
  const toggleSettings = useSimulationStore((s) => s.toggleSettings)
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const setScaleMode = useSimulationStore((s) => s.setScaleMode)
  const customScale = useSimulationStore((s) => s.customScale)
  const setCustomScale = useSimulationStore((s) => s.setCustomScale)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const toggleLabels = useSimulationStore((s) => s.toggleLabels)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const toggleReducedMotion = useSimulationStore((s) => s.toggleReducedMotion)

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.section
          role="dialog"
          aria-label="Settings"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glass-panel pointer-events-auto relative flex max-h-[75vh] w-full flex-col gap-5 overflow-y-auto rounded-t-3xl p-5 sm:max-h-[calc(100vh-7rem)] sm:w-96 sm:rounded-3xl"
        >
          <button
            type="button"
            onClick={toggleSettings}
            aria-label="Close settings"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <h2 className="text-lg font-semibold text-white">Settings</h2>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Visualization Scale</h3>
            <p className="text-xs leading-relaxed text-white/60">
              This visualization is not to scale — real distances and sizes would make most planets impossible to
              see at once. Pick how you’d like to explore instead.
            </p>
            <div className="flex flex-col gap-1.5">
              {SCALE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setScaleMode(mode.id)}
                  aria-pressed={scaleMode === mode.id}
                  className={`rounded-xl px-3 py-2 text-left transition-colors ${
                    scaleMode === mode.id ? 'bg-electric-blue/20 ring-1 ring-electric-blue/60' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{mode.label}</p>
                  <p className="text-xs text-white/60">{mode.description}</p>
                </button>
              ))}
            </div>

            {scaleMode === 'custom' && (
              <div className="mt-1 flex flex-col gap-3 rounded-xl bg-white/5 p-3">
                <label className="flex flex-col gap-1 text-xs text-white/70">
                  Size exaggeration ({customScale.sizeExaggeration.toFixed(1)}×)
                  <input
                    type="range"
                    min={0.4}
                    max={2.5}
                    step={0.1}
                    value={customScale.sizeExaggeration}
                    onChange={(e) => setCustomScale({ sizeExaggeration: Number(e.target.value) })}
                    className="accent-electric-blue"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-white/70">
                  Distance exaggeration ({customScale.distanceExaggeration.toFixed(1)}×)
                  <input
                    type="range"
                    min={0.4}
                    max={2.5}
                    step={0.1}
                    value={customScale.distanceExaggeration}
                    onChange={(e) => setCustomScale({ distanceExaggeration: Number(e.target.value) })}
                    className="accent-electric-blue"
                  />
                </label>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Accessibility</h3>
            <Toggle label="Planet labels" checked={showLabels} onChange={toggleLabels} />
            <Toggle label="Reduce motion" checked={reducedMotion} onChange={toggleReducedMotion} />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Keyboard Shortcuts</h3>
            <ul className="flex flex-col gap-1.5">
              {SHORTCUTS.map(([key, desc]) => (
                <li key={key} className="flex items-center justify-between text-xs text-white/70">
                  <kbd className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-white/90">{key}</kbd>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </section>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
