import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RANDOM_FACTS } from '../../data/facts'
import { useSimStore } from '../../store/simulationStore'
import { CloseIcon, SparkIcon } from './icons'
import { playBlip } from '../../utils/audio'

const CATEGORY_COLORS: Record<string, string> = {
  Sun: 'text-solar-400',
  Planets: 'text-cyan-300',
  Moons: 'text-nebula-400',
  Space: 'text-electric-400',
  Stars: 'text-amber-200',
}

/** "Teach Me Something!" — a big animated fact card. */
export function RandomFactCard() {
  const factIndex = useSimStore((s) => s.factCardIndex)
  const showFact = useSimStore((s) => s.showFact)
  const reducedMotion = useSimStore((s) => s.reducedMotion)

  const [localIndex, setLocalIndex] = useState<number | null>(null)
  const index = factIndex ?? localIndex
  const fact = index !== null ? RANDOM_FACTS[index % RANDOM_FACTS.length] : null

  const nextFact = () => {
    playBlip(980, 0.09)
    const current = index ?? 0
    const next = (current + 1 + Math.floor(Math.random() * 3)) % RANDOM_FACTS.length
    setLocalIndex(next)
    showFact(next)
  }

  const close = () => {
    setLocalIndex(null)
    showFact(null)
  }

  return (
    <AnimatePresence>
      {fact && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-space-950/70 backdrop-blur-sm"
            onClick={close}
            aria-label="Close fact card"
          />

          <motion.div
            role="dialog"
            aria-live="polite"
            aria-label="Astronomy fact"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 30, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="panel relative w-full max-w-lg rounded-3xl p-6 text-center"
          >
            <div
              className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border border-solar-400/40 bg-solar-400/15 text-solar-400"
              aria-hidden="true"
            >
              <SparkIcon width={26} height={26} />
            </div>

            <p className={`hud-title text-[11px] ${CATEGORY_COLORS[fact.category] ?? 'text-cyan-300'}`}>
              {fact.category} · Teach me something!
            </p>

            <p className="mt-3 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
              {fact.text}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" className="chip" onClick={nextFact}>
                <SparkIcon width={14} height={14} /> Another fact!
              </button>
              <button type="button" className="chip" onClick={close}>
                <CloseIcon width={14} height={14} /> Close
              </button>
            </div>

            <p className="mt-4 text-[11px] text-white/40">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5">R</kbd> any time for a new
              fact.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
