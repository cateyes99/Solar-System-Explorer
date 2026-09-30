import { AnimatePresence } from 'framer-motion'
import { SCALE_PRESETS } from '../../utils/scale'
import { useAppStore } from '../../store/useAppStore'
import { Panel } from './primitives/Panel'
import { Divider, Slider, Toggle } from './primitives/Controls'
import { Button } from './primitives/Button'
import { Icon } from './Icon'
import type { ScaleMode } from '../../types'

export function SettingsPanel() {
  const panel = useAppStore((s) => s.panel)
  const setPanel = useAppStore((s) => s.setPanel)
  const labelsVisible = useAppStore((s) => s.labelsVisible)
  const toggleLabels = useAppStore((s) => s.toggleLabels)
  const orbitsVisible = useAppStore((s) => s.orbitsVisible)
  const toggleOrbits = useAppStore((s) => s.toggleOrbits)
  const moonsVisible = useAppStore((s) => s.moonsVisible)
  const toggleMoons = useAppStore((s) => s.toggleMoons)
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setReducedMotion = useAppStore((s) => s.setReducedMotion)
  const bloom = useAppStore((s) => s.bloom)
  const setBloom = useAppStore((s) => s.setBloom)
  const quality = useAppStore((s) => s.quality)
  const setQuality = useAppStore((s) => s.setQuality)
  const scale = useAppStore((s) => s.scale)
  const setScale = useAppStore((s) => s.setScale)

  return (
    <AnimatePresence>
      {panel === 'settings' && (
        <Panel title="Settings" eyebrow="Display, sound and accessibility" onClose={() => setPanel(null)}>
          <div className="space-y-6">
            <section className="space-y-2.5">
              <Toggle
                label="Planet labels"
                description="Names that fade in as you get closer"
                checked={labelsVisible}
                onChange={toggleLabels}
                icon={<Icon name="label" size={15} className="text-ice-400" />}
              />
              <Toggle
                label="Orbit paths"
                description="The ellipse each planet follows"
                checked={orbitsVisible}
                onChange={toggleOrbits}
                icon={<Icon name="orbit" size={15} className="text-ice-400" />}
              />
              <Toggle
                label="Moons"
                description="Earth's Moon and the moons of Mars, Jupiter and Saturn"
                checked={moonsVisible}
                onChange={toggleMoons}
                icon={<Icon name="moon" size={15} className="text-ice-400" />}
              />
            </section>

            <Divider />

            <section>
              <h3 className="mb-2.5 text-[13px] font-semibold text-ice-50">Visual scale</h3>
              <p className="mb-3 text-[11.5px] leading-relaxed text-ice-400/75">
                This visualisation is <strong className="text-ice-200">not to scale</strong>. At true scale Earth
                would be a fraction of a pixel next to Jupiter, and Neptune would sit 600 times further out than
                Mercury. These settings trade accuracy for legibility.
              </p>
              <div className="space-y-1.5">
                {(Object.keys(SCALE_PRESETS) as Exclude<ScaleMode, 'custom'>[]).map((mode) => {
                  const preset = SCALE_PRESETS[mode]
                  const active = scale.mode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setScale({ mode, ...preset })}
                      aria-pressed={active}
                      className={[
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                        active ? 'border-cyan-glow/45 bg-cyan-glow/10' : 'border-edge hover:border-edge-strong',
                      ].join(' ')}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold text-ice-50">{preset.label}</span>
                        {active && <Icon name="target" size={15} className="shrink-0 text-cyan-glow" />}
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-relaxed text-ice-200/70">
                        {preset.blurb}
                      </span>
                    </button>
                  )
                })}

                {scale.mode === 'custom' && (
                  <div className="space-y-4 rounded-xl border border-edge bg-white/3 p-4">
                    <Slider
                      label="Planet size exaggeration"
                      value={scale.sizeExponent}
                      min={0.15}
                      max={1}
                      step={0.01}
                      onChange={(v) => setScale({ ...scale, sizeExponent: v })}
                      format={(v) => (v > 0.95 ? 'True relative size' : `${v.toFixed(2)}× curve`)}
                      hint="At 1.00 planet sizes are truly proportional. Lower values make them more similar."
                    />
                    <Slider
                      label="Orbit distance spread"
                      value={scale.distanceExponent}
                      min={0.3}
                      max={1}
                      step={0.01}
                      onChange={(v) => setScale({ ...scale, distanceExponent: v })}
                      format={(v) => (v > 0.95 ? 'True relative distances' : `${v.toFixed(2)}× curve`)}
                      hint="At 1.00 the distances are truly proportional, which leaves the system mostly empty."
                    />
                  </div>
                )}
              </div>
            </section>

            <Divider />

            <section className="space-y-2.5">
              <h3 className="text-[13px] font-semibold text-ice-50">Sound</h3>
              <Toggle
                label="Ambient space audio"
                description="A very quiet drone, plus soft clicks. Off until you turn it on."
                checked={soundEnabled}
                onChange={setSoundEnabled}
                icon={<Icon name={soundEnabled ? 'sound' : 'mute'} size={15} className="text-ice-400" />}
              />
            </section>

            <Divider />

            <section className="space-y-3">
              <h3 className="text-[13px] font-semibold text-ice-50">Performance</h3>
              <div>
                <p className="mb-1.5 text-[11.5px] text-ice-400/75">Quality</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['performance', 'balanced', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setQuality(level)}
                      aria-pressed={quality === level}
                      className={[
                        'rounded-lg border px-2 py-2 text-[11.5px] font-medium capitalize transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                        quality === level
                          ? 'border-cyan-glow/45 bg-cyan-glow/12 text-cyan-100'
                          : 'border-edge text-ice-200/80 hover:border-edge-strong',
                      ].join(' ')}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ice-400/65">
                  Turn this down if the scene ever feels slow. Everything stays fully interactive.
                </p>
              </div>
              <Toggle
                label="Glow and bloom"
                description="Bloom around the Sun and the stars"
                checked={bloom}
                onChange={setBloom}
                icon={<Icon name="sparkle" size={15} className="text-ice-400" />}
              />
            </section>

            <Divider />

            <section className="space-y-2.5">
              <h3 className="text-[13px] font-semibold text-ice-50">Accessibility</h3>
              <Toggle
                label="Reduce motion"
                description="Stops camera flights and the cinematic tour, and calms the star twinkle."
                checked={reducedMotion}
                onChange={setReducedMotion}
                icon={<Icon name="rotate" size={15} className="text-ice-400" />}
              />
              <Button
                icon="help"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPanel(null)
                  useAppStore.getState().setHelpVisible(true)
                }}
              >
                Keyboard shortcuts
              </Button>
            </section>

            <p className="text-[10.5px] leading-relaxed text-ice-400/55">
              Settings are remembered on this device. Sound never plays until you ask for it.
            </p>
          </div>
        </Panel>
      )}
    </AnimatePresence>
  )
}