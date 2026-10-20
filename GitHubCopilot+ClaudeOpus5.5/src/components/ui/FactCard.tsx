import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { RANDOM_FACTS } from '../../data/facts'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { useSimulationStore } from '../../store/simulationStore'
import { Icon } from './Icon'

function shuffledOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/** “Teach Me Something!” – a big animated card with a new fact on every click. */
export function FactCard() {
  const open = useSimulationStore((s) => s.factOpen)
  const index = useSimulationStore((s) => s.factIndex)
  const showFact = useSimulationStore((s) => s.showFact)
  const close = useSimulationStore((s) => s.closeFact)
  const ref = useDialogFocus<HTMLDivElement>(open, close)
  const order = useMemo(() => shuffledOrder(RANDOM_FACTS.length), [])
  const fact = RANDOM_FACTS[order[((index % order.length) + order.length) % order.length]]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-space-950/55 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fact-title"
            tabIndex={-1}
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] outline-none"
            initial={{ scale: 0.85, rotateX: 25, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            style={{ perspective: 1000 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-violet-700/85 to-sky-700/90" />
            <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" aria-hidden="true" />
            <div className="relative p-7 sm:p-10">
              <div className="flex items-center justify-between">
                <h2 id="fact-title" className="flex items-center gap-2 font-display text-lg font-bold text-amber-200">
                  <Icon name="lightbulb" /> Teach Me Something!
                </h2>
                <button type="button" className="btn btn-icon border-white/20 bg-white/10" onClick={close} aria-label="Close fact card">
                  <Icon name="close" />
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, rotateY: -12 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  exit={{ opacity: 0, y: -16, rotateY: 12 }}
                  transition={{ duration: 0.35 }}
                  aria-live="polite"
                >
                  <div className="chip mt-6 bg-white/15 text-white">{fact.topic}</div>
                  <p className="font-display mt-4 text-2xl leading-snug font-semibold text-white sm:text-[1.9rem]">{fact.text}</p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button type="button" className="btn-primary btn-solar" onClick={showFact} data-autofocus>
                  <Icon name="sparkles" size={18} /> Another fact!
                </button>
                <span className="text-xs text-white/70">Real astronomy, rounded to friendly numbers.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
