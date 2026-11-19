import { useCallback, useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'

interface ModalProps {
  open: boolean
  title: string
  eyebrow?: string
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
  className?: string
  onClose?: () => void
}

export function Modal({ open, title, eyebrow, children, size = 'medium', className = '', onClose }: ModalProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const setActiveModal = useSimulationStore((state) => state.setActiveModal)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const close = useCallback(() => {
    if (onClose) onClose()
    else setActiveModal(null)
  }, [onClose, setActiveModal])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const panelElement = panel.current
    const focusable = panelElement?.querySelector<HTMLElement>('button, [href], input, select, [tabindex]:not([tabindex="-1"])')
    window.setTimeout(() => focusable?.focus(), 60)
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key !== 'Tab' || !panelElement) return
      const items = Array.from(panelElement.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, select, [tabindex]:not([tabindex="-1"])'))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [open, close])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.22 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}
        >
          <motion.div
            ref={panel}
            className={`modal modal--${size} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="modal__header">
              <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
              <button className="icon-button" onClick={close} aria-label={`Close ${title}`}><X size={20} /></button>
            </header>
            <div className="modal__content">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
