import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Small animated hint that follows the pointer over an interactive body. */
export function Tooltip({
  name,
  detail,
  x,
  y,
  visible,
}: {
  name: string
  detail: string
  x: number
  y: number
  visible: boolean
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          style={{ left: x, top: y }}
          className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-[calc(100%+14px)]"
          aria-hidden
        >
          <div className="panel-quiet whitespace-nowrap px-3 py-2">
            <p className="text-[13px] font-semibold tracking-wide text-ice-50">{name}</p>
            <p className="text-[10px] font-medium tracking-[0.16em] text-cyan-200/70 uppercase">{detail}</p>
          </div>
          <div className="mx-auto h-1.5 w-1.5 -translate-y-1 rounded-full bg-cyan-glow/70" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Inline banner used for easter eggs and friendly nudges. */
export function Callout({
  visible,
  title,
  body,
  tone = 'cyan',
  icon = 'sparkle',
}: {
  visible: boolean
  title: string
  body: string
  tone?: 'cyan' | 'warm'
  icon?: 'sparkle' | 'sun'
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          role="status"
          className="panel pointer-events-auto flex max-w-sm items-start gap-3 px-4 py-3"
        >
          <span
            aria-hidden
            className={[
              'mt-0.5 shrink-0',
              tone === 'warm' ? 'text-solar' : 'text-cyan-glow',
            ].join(' ')}
          >
            {icon === 'sun' ? '☉' : '✦'}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-ice-50">{title}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ice-200/75">{body}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Shared wrapper for a floating centred overlay. */
export function ModalSurface({
  children,
  onDismiss,
  labelledBy,
  className = 'max-w-2xl',
}: {
  children: ReactNode
  onDismiss: () => void
  labelledBy: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onDismiss}
      className="absolute inset-0 z-50 flex items-center justify-center bg-void/72 p-4 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className={`panel scroll-area max-h-[85dvh] w-full overflow-y-auto px-6 py-6 ${className}`}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}