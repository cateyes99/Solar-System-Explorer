import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

/** Brief auto-dismissing message used for easter eggs (e.g. clicking Earth). */
export function Toast() {
  const toastMessage = useSimulationStore((s) => s.toastMessage)
  const dismissToast = useSimulationStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(dismissToast, 2600)
    return () => clearTimeout(timer)
  }, [toastMessage, dismissToast])

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="glass-panel pointer-events-none mx-auto w-fit rounded-full px-5 py-2.5 text-sm font-medium text-white"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
