import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

const WELCOME_SECONDS = 10

/** The first thing a visitor reads once the Solar System appears. */
export function WelcomeMessage() {
  const visible = useSimulationStore((s) => s.welcomeVisible && s.sceneReady && s.appMode === 'explore')
  const sceneReady = useSimulationStore((s) => s.sceneReady)
  const dismiss = useSimulationStore((s) => s.dismissWelcome)

  useEffect(() => {
    if (!sceneReady) return
    const timer = window.setTimeout(dismiss, WELCOME_SECONDS * 1000)
    return () => window.clearTimeout(timer)
  }, [sceneReady, dismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-[22%] z-10 flex flex-col items-center px-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          <motion.h1
            className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] sm:text-6xl"
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 1.2, duration: 1.4, ease: 'easeOut' }}
          >
            Welcome to the <span className="text-gradient">Solar System</span>
          </motion.h1>
          <motion.p
            className="mt-4 text-base font-medium text-slate-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 1.1 }}
          >
            Drag to explore <span className="mx-2 text-cyan-300">•</span> Click a planet to learn{' '}
            <span className="mx-2 text-cyan-300">•</span> Start a mission
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
