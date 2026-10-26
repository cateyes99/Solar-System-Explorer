import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from '../../i18n'
import { useSimulationStore } from '../../store/simulationStore'
import { CloseIcon, QuestionIcon } from './icons'

/**
 * Mission Control's "Spacecraft controls" popup.
 *
 * A quick reference for the flight keys, opened from the help icon in the panel
 * header. It lists exactly the keys the ship answers (see `Spacecraft.tsx`) plus
 * the notes that actually matter: the autopilot gate, the smooth build-up, and
 * the fact that R is shared with "return to the full view".
 */

/** One row per key, in reading order. */
const SHORTCUTS = ['forward', 'back', 'left', 'right', 'pitchUp', 'pitchDown', 'boost'] as const

/** The usage notes shown under the key list. */
const NOTES = ['autopilot', 'ramp', 'reset', 'camera'] as const

export function SpacecraftHelp() {
  const { t } = useTranslation()
  const open = useSimulationStore((state) => state.ui.spacecraftHelpOpen)
  const toggle = useSimulationStore((state) => state.toggleSpacecraftHelp)

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="spacecraft-help"
          role="dialog"
          aria-modal="true"
          aria-label={t('spacecraftHelp.title')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-void/72 px-3 py-6"
          onClick={() => toggle(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="sse-panel sse-scroll max-h-full w-[min(30rem,94vw)] overflow-y-auto p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-ice">
                <QuestionIcon size={20} />
                <div>
                  <p className="sse-label-text">{t('spacecraftHelp.eyebrow')}</p>
                  <h2 className="mt-0.5 text-lg font-semibold text-parchment">
                    {t('spacecraftHelp.title')}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                aria-label={t('spacecraftHelp.close')}
                onClick={() => toggle(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:text-parchment"
              >
                <span aria-hidden="true">
                  <CloseIcon />
                </span>
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-mist/90">{t('spacecraftHelp.intro')}</p>

            <div className="sse-divider my-3" />

            <ul className="space-y-1.5">
              {SHORTCUTS.map((id) => (
                <li key={id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="sse-chip shrink-0 px-2 py-0.5 text-[0.66rem] text-parchment">
                    {t(`spacecraftHelp.key.${id}`)}
                  </span>
                  <span className="text-right text-xs leading-relaxed text-mist/90">
                    {t(`spacecraftHelp.desc.${id}`)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="sse-divider my-3" />

            <ul className="space-y-1.5">
              {NOTES.map((id) => (
                <li key={id} className="flex gap-2 text-xs leading-relaxed text-mist/90">
                  <span aria-hidden="true" className="text-ice">
                    •
                  </span>
                  <span>{t(`spacecraftHelp.note.${id}`)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
