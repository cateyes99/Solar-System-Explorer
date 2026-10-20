import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/** First-10-seconds magic: a warm welcome that fades away by itself. */
export function WelcomeOverlay(): JSX.Element {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(false), 8500)
    const skip = (): void => setShow(false)
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="welcome"
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          <div className="text-center">
            <motion.h1
              initial={{ y: 26, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 120, damping: 18 }}
              className="font-display text-3xl font-bold text-white text-glow md:text-5xl"
            >
              Welcome to the Solar System
            </motion.h1>
            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-4 text-sm text-white/70 md:text-base"
            >
              Drag to explore • Click a planet to learn • Start a mission
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ delay: 1.4, duration: 2.4, repeat: Infinity }}
              className="mt-8 text-xs uppercase tracking-[0.3em] text-astro-cyan/70"
            >
              Your adventure starts here
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
