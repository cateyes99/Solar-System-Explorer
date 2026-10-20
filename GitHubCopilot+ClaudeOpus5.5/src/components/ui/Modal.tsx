import { AnimatePresence, motion } from 'framer-motion'
import { useId, type ReactNode } from 'react'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  size?: 'md' | 'lg'
}

/** Centered modal dialog with a dimmed backdrop. */
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useDialogFocus<HTMLDivElement>(open, onClose)
  const titleId = useId()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 grid place-items-center bg-space-950/60 p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={`glass flex max-h-[88vh] w-full flex-col overflow-hidden rounded-3xl outline-none ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center gap-3 px-6 pt-5 pb-3">
              <h2 id={titleId} className="font-display flex-1 text-xl font-bold text-white">
                {title}
              </h2>
              <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
