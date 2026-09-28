import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface TooltipProps {
  label: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

/** A small hover/focus tooltip for icon buttons. The trigger should carry its own aria-label. */
export function Tooltip({ label, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: position === 'top' ? 4 : -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? 4 : -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/85 px-2.5 py-1 text-xs font-medium text-white shadow-lg ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
