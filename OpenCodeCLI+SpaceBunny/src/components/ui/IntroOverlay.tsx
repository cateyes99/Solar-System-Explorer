import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { spaceAudio } from '../../utils/audio'

const LINES = [
  'Welcome to the Solar System',
  'Drag to explore • Click a planet to learn • Start a mission',
]

/**
 * The opening moment. Two lines, then the interface gets out of the way — the
 * scene itself is the hero.
 */
export function IntroOverlay() {
  const visible = useAppStore((s) => s.introVisible)
  const dismiss = useAppStore((s) => s.dismissIntro)
  const startTour = useAppStore((s) => s.startTour)
  const setHelpVisible = useAppStore((s) => s.setHelpVisible)
  const [line, setLine] = useState(0)

  useEffect(() => {
    if (!visible) return
    const first = window.setTimeout(() => setLine(1), 2600)
    const second = window.setTimeout(() => setLine(2), 6400)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          onClick={dismiss}
          className="pointer-events-auto absolute inset-0 z-40 flex cursor-pointer flex-col items-center justify-center bg-void/55 px-6 text-center backdrop-blur-[3px]"
        >
          <AnimatePresence mode="wait">
            {line === 0 && <span className="h-6" aria-hidden />}
            {line < 2 && (
              <motion.h2
                key={LINES[line]}
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
                className="text-balance max-w-3xl text-[26px] leading-[1.15] font-semibold tracking-tight text-ice-50 sm:text-[40px]"
              >
                {LINES[line]}
              </motion.h2>
            )}
          </AnimatePresence>

          {line === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-7 flex flex-col items-center gap-3"
            >
              <div className="flex flex-wrap justify-center gap-2.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(event) => {
                    event.stopPropagation()
                    dismiss()
                    startTour()
                    spaceAudio.play('whoosh')
                  }}
                  className="rounded-xl bg-ice-50 px-5 py-3 text-[13.5px] font-semibold text-void transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  Take the cinematic tour
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(event) => {
                    event.stopPropagation()
                    dismiss()
                    useAppStore.getState().openLesson('sizes')
                    spaceAudio.play('whoosh')
                  }}
                  className="rounded-xl border border-edge-strong bg-white/6 px-5 py-3 text-[13.5px] font-semibold text-ice-50 transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  Start learning
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(event) => {
                    event.stopPropagation()
                    setHelpVisible(true)
                  }}
                  className="rounded-xl px-4 py-3 text-[13.5px] font-semibold text-ice-200/80 transition-colors hover:text-ice-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  How do I use this?
                </motion.button>
              </div>
              <p className="text-[11px] text-ice-400/55">
                Click anywhere, or press Escape, to skip straight into the Solar System.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}