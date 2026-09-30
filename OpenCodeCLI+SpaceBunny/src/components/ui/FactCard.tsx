import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FACTS } from '../../data/facts'
import { useAppStore } from '../../store/useAppStore'
import { Icon } from './Icon'
import { IconButton } from './primitives/Button'

/**
 * "Teach Me Something!" — a full-width card that slides in over the bottom of
 * the scene. Each click deals a new fact; the pool never repeats back to back.
 */
export function FactCard() {
  const factIndex = useAppStore((s) => s.factIndex)
  const factVisible = useAppStore((s) => s.factVisible)
  const nextFact = useAppStore((s) => s.nextFact)
  const toggleFact = useAppStore((s) => s.toggleFact)

  // The deck is built once from a shuffled pool; a seeded PRNG keyed off the
  // index means the sequence is stable without re-shuffling mid-flight.
  const deck = useMemo(() => shuffleIndices(FACTS.length), [])
  const fact = FACTS[deck[factIndex % deck.length]] ?? FACTS[0]

  return (
    <AnimatePresence>
      {factVisible && (
        <motion.div
          key="fact"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
          role="dialog"
          aria-label="Astronomy fact"
          className="safe-bottom pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 sm:px-5"
        >
          <div className="panel w-full max-w-2xl overflow-hidden">
            <div className="flex items-start gap-4 px-5 py-5 sm:px-6 sm:py-6">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-solar/30 bg-solar/10 text-solar">
                <Icon name="lightbulb" size={19} />
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={fact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.26 }}
                  className="min-w-0 flex-1"
                  aria-live="polite"
                >
                  <p className="eyebrow mb-1">Did you know?</p>
                  <h2 className="text-balance text-[17px] leading-snug font-semibold tracking-tight text-ice-50 sm:text-[19px]">
                    {fact.title}
                  </h2>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ice-200/85 sm:text-sm">{fact.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-edge px-4 py-2.5 sm:px-5">
              <button
                type="button"
                onClick={nextFact}
                className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-cyan-200 transition-colors hover:bg-white/6 hover:text-ice-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                Another fact
              </button>
              <IconButton icon="close" label="Close the fact card" onClick={toggleFact} className="h-8 w-8" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Returns a permutation of 0..count-1 so facts appear in a random order. */
function shuffleIndices(count: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}