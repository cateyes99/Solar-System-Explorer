import { AnimatePresence } from 'framer-motion'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { useSimulationStore } from '../../store/simulationStore'
import type { WhatIfId } from '../../types'
import { Sheet, ToolbarButton } from './primitives'
import { CloseIcon } from './icons'

/**
 * "What If?" experiments.
 *
 * Each scenario is clearly labelled as an educational simulation rather than a
 * prediction, and each one changes exactly one thing in the scene so the child
 * can see cause and effect.
 */
export function WhatIfPanel() {
  const { t } = useTranslation()
  const content = useContent()
  const open = useSimulationStore((state) => state.ui.whatIfOpen)
  const toggleWhatIf = useSimulationStore((state) => state.toggleWhatIf)
  const activeId = useSimulationStore((state) => state.whatIfId)
  const setWhatIf = useSimulationStore((state) => state.setWhatIf)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const resetView = useSimulationStore((state) => state.resetView)
  const showToast = useSimulationStore((state) => state.showToast)

  const scenarios = content.scenarios
  const active = scenarios.find((scenario) => scenario.id === activeId)

  const choose = (id: WhatIfId): void => {
    const scenario = scenarios.find((entry) => entry.id === id)
    setWhatIf(activeId === id ? null : id)
    if (scenario && activeId !== id) {
      showToast(`${scenario.emoji} ${scenario.title}`, 'fun')
      if (id === 'two-moons') focusBody('earth', 'planet', 7)
      if (id === 'earth-jupiter-size') focusBody('earth', 'planet', 5)
      if (id === 'no-sun') resetView()
      if (id === 'no-rotation') focusBody('earth', 'planet', 5)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <Sheet position="center" label={t('whatif.label')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="sse-label-text text-violet">{t('whatif.eyebrow')}</p>
              <h2 className="mt-1 text-lg font-semibold text-parchment">{t('whatif.title')}</h2>
              <p className="mt-1 text-xs leading-relaxed text-mist/90">{t('whatif.intro')}</p>
            </div>
            <button
              type="button"
              aria-label={t('whatif.close')}
              onClick={() => toggleWhatIf(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:text-parchment"
            >
              <span aria-hidden="true">
                <CloseIcon />
              </span>
            </button>
          </div>

          <div className="sse-divider my-3" />

          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const selected = scenario.id === activeId
              return (
                <div
                  key={scenario.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    selected ? 'border-violet/50 bg-violet/12' : 'border-white/10 bg-white/4'
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(scenario.id)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-lg">
                        {scenario.emoji}
                      </span>
                      <span className="text-sm font-semibold text-parchment">{scenario.title}</span>
                    </span>
                    <span className="sse-label-text text-[0.6rem]">
                      {selected ? t('whatif.active') : t('whatif.tryIt')}
                    </span>
                  </button>

                  {selected ? (
                    <>
                      <p className="mt-2 text-xs leading-relaxed text-parchment/90">{scenario.explanation}</p>
                      <p className="mt-2 rounded-lg border border-ice/25 bg-ice/8 px-2.5 py-2 text-xs text-ice">
                        {scenario.takeaway}
                      </p>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <ToolbarButton
              compact
              variant={active ? 'danger' : 'ghost'}
              onClick={() => {
                setWhatIf(null)
                resetView()
              }}
              disabled={!active}
            >
              {t('whatif.reset')}
            </ToolbarButton>
            <ToolbarButton compact variant="subtle" onClick={() => toggleWhatIf(false)}>
              {t('whatif.back')}
            </ToolbarButton>
          </div>
        </Sheet>
      ) : null}
    </AnimatePresence>
  )
}
