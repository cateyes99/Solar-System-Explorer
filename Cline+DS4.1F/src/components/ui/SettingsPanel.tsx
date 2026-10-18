import { AnimatePresence } from 'framer-motion'
import { useTranslation } from '../../i18n'
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
const QUALITY_LEVELS: QualityLevel[] = ['low', 'medium', 'high']

export function SettingsPanel() {
  const { t } = useTranslation()
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
        <Sheet label={t('settings.label')}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-parchment">{t('settings.title')}</h2>
            <button
              type="button"
              onClick={() => openSettings(false)}
              className="min-h-[2.5rem] rounded-xl border border-white/12 bg-white/5 px-3 text-sm text-mist transition-colors hover:text-parchment"
            >
              {t('settings.done')}
            </button>
          </div>
          <div className="sse-divider my-3" />

          <section>
            <SectionTitle hint={t('settings.soundHint')}>{t('settings.sound')}</SectionTitle>
            <ToggleRow
              label={t('settings.ambientAudio')}
              description={t('settings.ambientAudioDesc')}
              checked={soundEnabled}
              onChange={() => setSoundEnabled(!soundEnabled)}
            />
            <SliderRow
              label={t('settings.volume')}
              value={volume}
              min={0}
              max={1}
              step={0.05}
              onChange={setVolume}
              format={(value) => `${Math.round(value * 100)}%`}
            />
          </section>

          <section className="mt-4">
            <SectionTitle hint={t('settings.comfortHint')}>{t('settings.comfort')}</SectionTitle>
            <ToggleRow
              label={t('settings.reduceMotion')}
              description={t('settings.reduceMotionDesc')}
              checked={reducedMotion}
              onChange={() => setReducedMotion(!reducedMotion)}
            />
          </section>

          <section className="mt-4">
            <SectionTitle hint={t('settings.graphicsHint')}>{t('settings.graphics')}</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {QUALITY_LEVELS.map((level) => (
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
                  {t(`settings.quality.${level}`)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-mist/80">
              {t('settings.qualityNote')}
            </p>
          </section>

          <section className="mt-4 md:hidden">
            <SectionTitle hint={t('settings.scaleSectionHint')}>{t('settings.scaleSection')}</SectionTitle>
            <SimulationControlsContent />
          </section>

          <section className="mt-4">
            <SectionTitle>{t('settings.explore')}</SectionTitle>
            <ToolbarButton compact onClick={resetView}>
              {t('settings.returnView')}
            </ToolbarButton>
          </section>

          <p className="mt-4 text-[0.66rem] leading-relaxed text-mist/75">{t('settings.footer')}</p>
        </Sheet>
      ) : null}
    </AnimatePresence>
  )
}
