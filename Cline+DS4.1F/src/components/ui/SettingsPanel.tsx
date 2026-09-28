import { AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { SimulationControlsContent } from './SimulationControls'
import { SectionTitle, Sheet, SliderRow, ToggleRow, ToolbarButton } from './primitives'
import type { QualityLevel } from '../../types'

/**
 * Settings.
 *
 * On phones and tablets this sheet is also where the scale picker and the layer
 * toggles live, so nothing is unreachable on a small screen.
 */
const QUALITY_LABELS: Record<QualityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function SettingsPanel() {
  const open = useSimulationStore((state) => state.ui.settingsOpen)
  const openSettings = useSimulationStore((state) => state.openSettings)
  const soundEnabled = useSimulationStore((state) => state.soundEnabled)
  const setSoundEnabled = useSimulationStore((state) => state.setSoundEnabled)
  const volume = useSimulationStore((state) => state.volume)
  const setVolume = useSimulationStore((state) => state.setVolume)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const setReducedMotion = useSimulationStore((state) => state.setReducedMotion)
  const quality = useSimulationStore((state) => state.quality)
  const setQuality = useSimulationStore((state) => state.setQuality)
  const resetView = useSimulationStore((state) => state.resetView)

  return (
    <AnimatePresence>
      {open ? (
        <Sheet label="Settings and display options">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-parchment">Settings</h2>
            <button
              type="button"
              onClick={() => openSettings(false)}
              className="min-h-[2.5rem] rounded-xl border border-white/12 bg-white/5 px-3 text-sm text-mist transition-colors hover:text-parchment"
            >
              Done
            </button>
          </div>
          <div className="sse-divider my-3" />

          <section>
            <SectionTitle hint="off by default">Sound</SectionTitle>
            <ToggleRow
              label="Ambient space audio"
              description="Generated live with the Web Audio API"
              checked={soundEnabled}
              onChange={() => setSoundEnabled(!soundEnabled)}
            />
            <SliderRow
              label="Volume"
              value={volume}
              min={0}
              max={1}
              step={0.05}
              onChange={setVolume}
              format={(value) => `${Math.round(value * 100)}%`}
            />
          </section>

          <section className="mt-4">
            <SectionTitle hint="accessibility">Comfort</SectionTitle>
            <ToggleRow
              label="Reduce motion"
              description="Calmer camera moves and fewer effects"
              checked={reducedMotion}
              onChange={() => setReducedMotion(!reducedMotion)}
            />
          </section>

          <section className="mt-4">
            <SectionTitle hint="performance">Graphics quality</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {(['low', 'medium', 'high'] as QualityLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={quality === level}
                  onClick={() => setQuality(level)}
                  className={`min-h-[2.5rem] rounded-lg border px-3 text-xs font-medium transition-colors ${
                    quality === level
                      ? 'border-ice/60 bg-ice/20 text-parchment'
                      : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
                  }`}
                >
                  {QUALITY_LABELS[level]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-mist/80">
              Surface textures are generated once when the page loads at the quality level detected at that moment.
              Changing quality afterwards adjusts geometry detail, star counts and post-processing.
            </p>
          </section>

          <section className="mt-4 md:hidden">
            <SectionTitle hint="also on the left on bigger screens">Scale, layers and camera</SectionTitle>
            <SimulationControlsContent />
          </section>

          <section className="mt-4">
            <SectionTitle>Explore</SectionTitle>
            <ToolbarButton compact onClick={resetView}>
              Return to the full Solar System view
            </ToolbarButton>
          </section>

          <p className="mt-4 text-[0.66rem] leading-relaxed text-mist/75">
            Built with React, TypeScript, Three.js and react-three-fiber. All surface textures are generated
            procedurally in your browser — no image files are downloaded. Planetary data comes from NASA and IAU
            reference values.
          </p>
        </Sheet>
      ) : null}
    </AnimatePresence>
  )
}