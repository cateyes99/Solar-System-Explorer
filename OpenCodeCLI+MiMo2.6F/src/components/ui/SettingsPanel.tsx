import { AnimatePresence, motion } from 'framer-motion'
import { useSimStore, type SpeedPreset } from '../../store/simulationStore'
import { SCALE_NOTES, type ScaleMode } from '../../utils/scale'
import { usePlanetFocus } from '../../hooks/usePlanetFocus'
import { BODY_BY_ID, PLANETS } from '../../data/planets'
import { playBlip } from '../../utils/audio'
import { CloseIcon, GlobeIcon, HelpIcon } from './icons'

interface ToggleProps {
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
}

function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-white/55">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-9 shrink-0 appearance-none rounded-full bg-white/20 transition-colors
                   checked:bg-cyan-400 relative
                   before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full
                   before:bg-white before:transition-transform before:content-['']
                   checked:before:translate-x-4"
      />
    </label>
  )
}

const SPEED_LABELS: { id: SpeedPreset; label: string }[] = [
  { id: 'slow', label: 'Slow' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
  { id: 'veryFast', label: 'Very Fast' },
  { id: 'epic', label: 'Epic' },
]

const SCALE_LABELS: { id: ScaleMode; label: string }[] = [
  { id: 'educational', label: 'Educational Scale' },
  { id: 'relativeSize', label: 'Relative Size' },
  { id: 'distances', label: 'Distances Emphasized' },
  { id: 'custom', label: 'Custom' },
]

export function SettingsPanel() {
  const panel = useSimStore((s) => s.panel)
  const openPanel = useSimStore((s) => s.openPanel)
  const showLabels = useSimStore((s) => s.showLabels)
  const showOrbits = useSimStore((s) => s.showOrbits)
  const showAsteroids = useSimStore((s) => s.showAsteroids)
  const soundOn = useSimStore((s) => s.soundOn)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const quality = useSimStore((s) => s.quality)
  const scaleMode = useSimStore((s) => s.scaleMode)
  const toggleLabels = useSimStore((s) => s.toggleLabels)
  const toggleOrbits = useSimStore((s) => s.toggleOrbits)
  const toggleSound = useSimStore((s) => s.toggleSound)
  const toggleReducedMotion = useSimStore((s) => s.toggleReducedMotion)
  const setQuality = useSimStore((s) => s.setQuality)
  const setScaleMode = useSimStore((s) => s.setScaleMode)
  const toggleShortcuts = useSimStore((s) => s.toggleShortcuts)
  const setSpeed = useSimStore((s) => s.setSpeed)
  const speedPreset = useSimStore((s) => s.speedPreset)
  const { home } = usePlanetFocus()

  const open = panel === 'settings'

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="Settings"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="panel fixed z-40 flex flex-col overflow-hidden
                     inset-x-0 bottom-0 max-h-[70svh] rounded-t-3xl
                     md:inset-x-auto md:right-3 md:top-24 md:max-h-[74vh] md:w-[23rem] md:rounded-3xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="hud-title text-sm text-cyan-300">Settings</h2>
            <button
              type="button"
              className="chip !px-2 !py-1"
              onClick={() => openPanel('none')}
              aria-label="Close settings"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto px-4 py-3">
            <section aria-labelledby="settings-display">
              <h3 id="settings-display" className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
                Display
              </h3>
              <div className="space-y-2">
                <Toggle
                  label="Planet labels"
                  hint="Names float above every world"
                  checked={showLabels}
                  onChange={toggleLabels}
                />
                <Toggle
                  label="Orbit lines"
                  hint="Show each planet's path"
                  checked={showOrbits}
                  onChange={toggleOrbits}
                />
                <Toggle
                  label="Asteroid belt"
                  hint="The rocky traffic between Mars and Jupiter"
                  checked={showAsteroids}
                  onChange={() => useSimStore.setState({ showAsteroids: !showAsteroids })}
                />
              </div>
            </section>

            <section aria-labelledby="settings-access">
              <h3 id="settings-access" className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
                Accessibility & sound
              </h3>
              <div className="space-y-2">
                <Toggle
                  label="Reduce motion"
                  hint="Calms camera moves, twinkle and auto animation"
                  checked={reducedMotion}
                  onChange={toggleReducedMotion}
                />
                <Toggle
                  label="Ambient sound"
                  hint="Off by default — a very quiet space drone"
                  checked={soundOn}
                  onChange={toggleSound}
                />
                <button type="button" className="chip w-full justify-center" onClick={toggleShortcuts}>
                  <HelpIcon width={14} height={14} /> Keyboard shortcuts
                </button>
              </div>
            </section>

            <section aria-labelledby="settings-quality">
              <h3 id="settings-quality" className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
                Performance
              </h3>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Render quality">
                {(['auto', 'high', 'low'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="chip capitalize"
                    data-active={quality === option ? 'true' : 'false'}
                    aria-pressed={quality === option}
                    onClick={() => setQuality(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-white/50">
                “Auto” adjusts pixel ratio to keep the frame rate smooth on any laptop.
              </p>
            </section>

            <section aria-labelledby="settings-scale">
              <h3 id="settings-scale" className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
                Scale mode
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {SCALE_LABELS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="chip chip-solar !text-[11px]"
                    data-active={scaleMode === option.id ? 'true' : 'false'}
                    aria-pressed={scaleMode === option.id}
                    onClick={() => setScaleMode(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-amber-200/80">
                {SCALE_NOTES[scaleMode]}
              </p>
            </section>

            <section aria-labelledby="settings-time">
              <h3 id="settings-time" className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
                Default time speed
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {SPEED_LABELS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="chip"
                    data-active={speedPreset === option.id ? 'true' : 'false'}
                    aria-pressed={speedPreset === option.id}
                    onClick={() => setSpeed(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="settings-about" className="rounded-xl border border-white/10 bg-white/5 p-3">
              <h3 id="settings-about" className="mb-1 hud-title text-[11px] text-cyan-300">
                About this model
              </h3>
              <p className="text-[11px] leading-relaxed text-white/65">
                Real astronomical data (sizes, distances, periods) comes from rounded NASA/JPL
                figures. Positions are a simplified educational model, not a precise ephemeris.
                Anything labelled “What if?” is a hypothetical simulation, never a prediction.
              </p>
            </section>

            <button
              type="button"
              className="chip w-full justify-center"
              onClick={() => {
                home()
                openPanel('none')
              }}
            >
              <GlobeIcon width={14} height={14} /> Reset to full Solar System view
            </button>

            <button
              type="button"
              className="chip w-full justify-center !border-solar-400/50 !text-solar-200"
              onClick={() => {
                const targets = ['sun', ...PLANETS.map((planet) => planet.id)]
                const id = targets[Math.floor(Math.random() * targets.length)]
                const body = BODY_BY_ID[id]
                useSimStore.getState().focusBody(id)
                useSimStore.getState().showToast(`🎲 Surprise! Say hello to ${body.name}.`, 'fun')
                playBlip(1040, 0.12)
                openPanel('none')
              }}
            >
              🎲 Surprise me — visit a random world
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
