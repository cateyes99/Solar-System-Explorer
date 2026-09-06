import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PanelProps {
  open: boolean
  title: string
  emoji?: string
  onClose: () => void
  side?: 'left' | 'right'
  children: ReactNode
}

/**
 * Sliding glass drawer: a side panel on desktop, a bottom sheet on mobile.
 * All app panels (Learn, What If, Missions, Settings, Planet info) reuse this.
 */
export function Panel({ open, title, emoji, onClose, side = 'left', children }: PanelProps): JSX.Element {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="panel"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ type: 'spring', stiffness: 280, damping: 32 }}
          className={`glass fixed z-40 flex flex-col overflow-hidden rounded-2xl max-md:inset-x-2 max-md:bottom-2 max-md:max-h-[64vh] md:bottom-24 md:top-20 ${
            side === 'left' ? 'md:left-4 md:w-[380px]' : 'md:right-4 md:w-[400px]'
          }`}
          role="dialog"
          aria-label={title}
        >
          <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            {emoji && (
              <span aria-hidden className="text-lg">
                {emoji}
              </span>
            )}
            <h2 className="font-display text-sm font-semibold tracking-wide text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="btn ml-auto h-8 w-8 rounded-lg !px-0 text-base leading-none"
            >
              ×
            </button>
          </header>
          <div className="scroll-slim flex-1 overflow-y-auto p-4">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
