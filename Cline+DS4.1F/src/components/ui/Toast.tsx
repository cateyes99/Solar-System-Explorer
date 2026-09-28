import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * Small, unobtrusive notifications used for Easter eggs, discoveries and gentle
 * warnings. They are announced politely to screen readers as well.
 */
const TONE_STYLES: Record<string, string> = {
  info: 'border-ice/35 text-parchment',
  fun: 'border-solar/45 text-parchment',
  alert: 'border-red-400/45 text-parchment',
}

export function Toast() {
  const toast = useSimulationStore((state) => state.toast)
  const clearToast = useSimulationStore((state) => state.clearToast)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => clearToast(), 6200)
    return () => window.clearTimeout(id)
  }, [toast, clearToast])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-32 z-40 flex justify-center px-3 sm:bottom-36">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.26 }}
            className={`pointer-events-auto max-w-[34rem] rounded-2xl border bg-abyss/92 px-4 py-3 text-sm shadow-[0_18px_50px_-22px_rgba(6,12,32,0.95)] backdrop-blur ${
              TONE_STYLES[toast.tone] ?? TONE_STYLES.info
            }`}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}