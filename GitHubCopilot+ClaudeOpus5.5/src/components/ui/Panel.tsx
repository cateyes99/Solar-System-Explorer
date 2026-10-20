import { AnimatePresence, motion } from 'framer-motion'
import { useId, type ReactNode } from 'react'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { Icon } from './Icon'

interface PanelProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  eyebrow?: ReactNode
  accent?: string
  children: ReactNode
  /** Rendered in the header row, next to the close button. */
  headerExtra?: ReactNode
  closeLabel?: string
}

/** Side panel on desktop, bottom sheet on tablets and phones. */
export function Panel({ open, onClose, title, eyebrow, accent = '#5ee7ff', children, headerExtra, closeLabel = 'Close panel' }: PanelProps) {
  const isDesktop = useIsDesktop()
  const ref = useDialogFocus<HTMLDivElement>(open, onClose)
  const titleId = useId()

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          ref={ref}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          tabIndex={-1}
          key="panel"
          initial={isDesktop ? { opacity: 0, x: 40 } : { y: '100%' }}
          animate={isDesktop ? { opacity: 1, x: 0 } : { y: 0 }}
          exit={isDesktop ? { opacity: 0, x: 40 } : { y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          className={
            isDesktop
              ? 'glass pointer-events-auto fixed top-[5.25rem] right-4 bottom-[7.5rem] z-30 flex w-[420px] flex-col overflow-hidden rounded-3xl outline-none'
              : 'glass pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex max-h-[58vh] flex-col overflow-hidden rounded-t-3xl outline-none'
          }
        >
          <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          {!isDesktop && <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-white/20" aria-hidden="true" />}
          <div className="flex shrink-0 items-start gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0 flex-1">
              {eyebrow && <div className="mb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">{eyebrow}</div>}
              <h2 id={titleId} className="font-display text-2xl leading-tight font-bold text-white">
                {title}
              </h2>
            </div>
            {headerExtra}
            <button type="button" className="btn btn-icon shrink-0" onClick={onClose} aria-label={closeLabel}>
              <Icon name="close" />
            </button>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
