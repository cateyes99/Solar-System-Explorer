import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulation } from '../../store/simulationStore'

function ToastItem({ id, text, emoji }: { id: number; text: string; emoji?: string }): JSX.Element {
  const dismiss = useSimulation((s) => s.dismissToast)
  useEffect(() => {
    const t = window.setTimeout(() => dismiss(id), 5200)
    return () => window.clearTimeout(t)
  }, [id, dismiss])
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="glass pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-2.5 text-sm leading-snug text-white/90"
      role="status"
    >
      {emoji && (
        <span aria-hidden className="text-base">
          {emoji}
        </span>
      )}
      {text}
    </motion.div>
  )
}

/** Gentle top-centre notifications (easter eggs, what-if notes, arrivals…). */
export function Toasts(): JSX.Element {
  const toasts = useSimulation((s) => s.toasts)
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} id={t.id} text={t.text} emoji={t.emoji} />
        ))}
      </AnimatePresence>
    </div>
  )
}
