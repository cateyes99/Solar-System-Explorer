import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FACTS } from '../../data/facts'
import { useSimulation } from '../../store/simulationStore'
import { audio } from '../../audio/audioEngine'

const EMOJIS = ['✨', '🚀', '🌟', '☄️', '🪐', '🔭', '🌠']

function randomIndex(except: number): number {
  let n = except
  while (n === except) n = Math.floor(Math.random() * FACTS.length)
  return n
}

/** The big animated "Teach Me Something!" fact card. */
export function FactCard(): JSX.Element {
  const open = useSimulation((s) => s.panel === 'facts')
  const setPanel = useSimulation((s) => s.setPanel)
  const [index, setIndex] = useState(() => Math.floor(Math.random() * FACTS.length))

  const next = useCallback((): void => {
    setIndex((i) => randomIndex(i))
    audio.blip(920)
  }, [])

  // Fresh fact every time the card opens.
  useEffect(() => {
    if (open) next()
  }, [open, next])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="fact-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPanel('none')}
        >
          <motion.div
            role="dialog"
            aria-label="Random astronomy fact"
            className="glass relative w-full max-w-lg rounded-3xl p-8 text-center"
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl" aria-hidden>
              {EMOJIS[index % EMOJIS.length]}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 text-xl font-medium leading-snug text-white"
              >
                {FACTS[index]}
              </motion.p>
            </AnimatePresence>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <button type="button" className="btn btn-primary" onClick={next}>
                🎲 Another one!
              </button>
              <button type="button" className="btn" onClick={() => setPanel('none')}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
