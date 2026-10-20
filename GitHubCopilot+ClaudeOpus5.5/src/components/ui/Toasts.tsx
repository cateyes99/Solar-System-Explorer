import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { Icon } from './Icon'

const TONE_STYLES = {
  info: 'border-sky-300/30',
  success: 'border-emerald-300/40',
  discovery: 'border-amber-300/50',
} as const

export function Toasts() {
  const toasts = useSimulationStore((s) => s.toasts)
  const dismiss = useSimulationStore((s) => s.dismissToast)
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[5rem] z-40 flex flex-col items-center gap-2 px-3"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className={`glass pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 ${TONE_STYLES[toast.tone]}`}
          >
            <span className={`mt-0.5 ${toast.tone === 'discovery' ? 'text-amber-300' : toast.tone === 'success' ? 'text-emerald-300' : 'text-sky-300'}`}>
              <Icon name={toast.tone === 'discovery' ? 'sparkles' : toast.tone === 'success' ? 'check' : 'globe'} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-white">{toast.title}</div>
              {toast.message && <div className="mt-0.5 text-sm leading-snug text-slate-300">{toast.message}</div>}
            </div>
            <button type="button" className="-mr-1 rounded-full p-1 text-slate-400 hover:text-white" onClick={() => dismiss(toast.id)} aria-label="Dismiss message">
              <Icon name="close" size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
