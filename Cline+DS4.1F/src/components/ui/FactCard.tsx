import { AnimatePresence, motion } from 'framer-motion'
import { currentFact, useSimulationStore } from '../../store/simulationStore'
import { BulbIcon, CloseIcon } from './icons'

/**
 * "Teach Me Something!" — a large animated fact card.
 *
 * The fact list is curated, checked astronomy, and every card is one sentence so
 * it can be read out loud in a single breath.
 */
export function FactCard() {
  const open = useSimulationStore((state) => state.ui.factCardOpen)
  const closeFactCard = useSimulationStore((state) => state.closeFactCard)
  const teachMeSomething = useSimulationStore((state) => state.teachMeSomething)
  const fact = useSimulationStore((state) => currentFact(state))

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="fact-card"
          role="dialog"
          aria-label="A random space fact"
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 26, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed inset-x-3 bottom-24 z-40 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[min(34rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto"
        >
          <div className="sse-panel relative overflow-hidden p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-violet/35 to-transparent blur-2xl"
            />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-ice">
                <BulbIcon size={20} />
                <span className="sse-label-text">Teach me something!</span>
              </div>
              <button
                type="button"
                aria-label="Close the fact card"
                onClick={closeFactCard}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:text-parchment"
              >
                <span aria-hidden="true">
                  <CloseIcon />
                </span>
              </button>
            </div>

            <motion.p
              key={fact}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="sse-text-shadow mt-4 text-lg leading-relaxed text-parchment"
            >
              {fact}
            </motion.p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={teachMeSomething}
                className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-electric/60 bg-electric/90 px-4 text-sm font-semibold text-white transition-colors hover:bg-electric"
              >
                Another one, please!
              </button>
              <button
                type="button"
                onClick={closeFactCard}
                className="inline-flex min-h-[2.75rem] items-center rounded-xl border border-white/12 bg-white/5 px-4 text-sm text-mist transition-colors hover:text-parchment"
              >
                Back to space
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}