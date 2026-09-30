import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { IconButton } from './Button'
import { useLayout } from '../../../hooks/useMediaQuery'

/** Stable autofocus flag so the close button always receives focus on mount. */
const AUTO_FOCUS = true

interface PanelProps {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Phones and tablets always render a bottom sheet, regardless of this hint. */
  variant?: 'side'
}

/**
 * Shared chrome for every overlay. Desktop gets a floating side panel, mobile a
 * bottom sheet — same content, deliberately different layout.
 */
export function Panel({ title, eyebrow, onClose, children, footer, variant = 'side' }: PanelProps) {
  const { isCompact } = useLayout()
  const surface = isCompact ? 'sheet' : variant

  // Move focus into the panel so keyboard and screen-reader users land here.
  // AutoFocus rather than an effect: React applies it on mount, which avoids a
  // second render pass.

  return (
    <motion.aside
      initial={{ opacity: 0, x: surface === 'sheet' ? 0 : 28, y: surface === 'sheet' ? 40 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: surface === 'sheet' ? 0 : 24, y: surface === 'sheet' ? 30 : 0 }}
      transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
      aria-label={title}
      className={[
        'panel pointer-events-auto absolute z-30 flex min-h-0 flex-col overflow-hidden',
        surface === 'sheet'
          ? // Nearly opaque: the scene, nav rail and timeline all sit behind a
            // sheet on a phone, and a translucent one would be unreadable.
            'safe-bottom inset-x-0 bottom-0 max-h-[72dvh] rounded-t-2xl rounded-b-none border-b-0 bg-[rgb(8_12_24/0.95)]'
          : // Clears the header bar so the two never overlap.
            'right-4 top-[4.75rem] bottom-4 w-[min(24rem,calc(100vw-2rem))]',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3 border-b border-edge px-5 py-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 className="truncate text-[17px] font-semibold tracking-tight text-ice-50">{title}</h2>
        </div>
        <IconButton
          autoFocus={AUTO_FOCUS}
          icon="close"
          label={`Close ${title}`}
          onClick={onClose}
          className="-mr-2 -mt-1"
          size={20}
        />
      </header>

      {surface === 'sheet' && (
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>
      )}

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

      {footer && <footer className="border-t border-edge px-5 py-3">{footer}</footer>}
    </motion.aside>
  )
}