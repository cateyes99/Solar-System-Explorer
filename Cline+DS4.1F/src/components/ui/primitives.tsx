import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * Small, reusable interface pieces.
 *
 * Everything is a real HTML element with an accessible name, sized for both a
 * mouse and a thumb (a 44px minimum touch target), and styled with the shared
 * glass-panel tokens so panels stay consistent.
 */

interface PanelProps {
  children: ReactNode
  className?: string
  as?: 'section' | 'aside' | 'div'
  label?: string
}

export function Panel({ children, className = '', as = 'section', label }: PanelProps) {
  const Component = as
  return (
    <Component aria-label={label} className={`sse-panel ${className}`}>
      {children}
    </Component>
  )
}

interface SectionTitleProps {
  children: ReactNode
  hint?: string
}

export function SectionTitle({ children, hint }: SectionTitleProps) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="sse-label-text">{children}</h2>
      {hint ? <span className="text-[0.65rem] text-mist/80">{hint}</span> : null}
    </div>
  )
}

type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger'

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  active?: boolean
  variant?: ButtonVariant
  /** Hides the text label on small screens while keeping it for screen readers. */
  compact?: boolean
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-electric/90 text-white hover:bg-electric border-electric/60 shadow-[0_10px_30px_-12px_rgba(47,123,255,0.9)]',
  ghost: 'bg-white/5 text-parchment hover:bg-white/12 border-white/12',
  subtle: 'bg-transparent text-mist hover:text-parchment hover:bg-white/8 border-white/10',
  danger: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 border-red-400/30',
}

export function ToolbarButton({
  icon,
  active = false,
  variant = 'ghost',
  compact = false,
  children,
  className = '',
  ...rest
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      aria-pressed={rest['aria-pressed'] ?? (active ? true : undefined)}
      className={`inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 ${
        active ? VARIANT_CLASSES.primary : VARIANT_CLASSES[variant]
      } ${className}`}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {/* sr-only keeps the accessible name on small screens, where the label is
          intentionally hidden to save space. */}
      <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>{children}</span>
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: this is the only accessible name for the button. */
  label: string
  icon: ReactNode
  active?: boolean
}

export function IconButton({ label, icon, active = false, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-150 ${
        active
          ? 'border-electric/70 bg-electric/25 text-parchment'
          : 'border-white/12 bg-white/5 text-mist hover:bg-white/12 hover:text-parchment'
      } ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}

export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/6"
    >
      <span>
        <span className="block text-sm text-parchment">{label}</span>
        {description ? <span className="block text-xs text-mist/85">{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-ice/60 bg-ice/35' : 'border-white/15 bg-white/8'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-parchment shadow transition-transform duration-200 ${
            checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
  hint?: string
}

export function SliderRow({ label, value, min, max, step, onChange, format, hint }: SliderRowProps) {
  const display = format ? format(value) : value.toFixed(2)
  return (
    <label className="block rounded-lg px-2 py-2">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-parchment">{label}</span>
        <span className="sse-numeric text-xs text-ice">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-ice"
      />
      {hint ? <span className="mt-1 block text-xs text-mist/80">{hint}</span> : null}
    </label>
  )
}

interface ChipProps {
  children: ReactNode
  tone?: 'neutral' | 'ice' | 'solar' | 'violet'
}

const CHIP_TONES: Record<NonNullable<ChipProps['tone']>, string> = {
  neutral: 'text-mist',
  ice: 'text-ice',
  solar: 'text-solar',
  violet: 'text-violet',
}

export function Chip({ children, tone = 'neutral' }: ChipProps) {
  return (
    <span
      className={`sse-chip inline-flex items-center gap-1 px-2.5 py-1 text-[0.68rem] uppercase ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  )
}

interface StatProps {
  label: string
  value: string
  hint?: string
}

export function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-2">
      <div className="sse-label-text text-[0.6rem]">{label}</div>
      <div className="sse-numeric mt-0.5 text-sm text-parchment">{value}</div>
      {hint ? <div className="mt-0.5 text-[0.65rem] text-mist/80">{hint}</div> : null}
    </div>
  )
}

interface SheetProps {
  children: ReactNode
  /** A right-hand drawer on desktop, a bottom sheet on phones. */
  position?: 'right' | 'bottom' | 'center'
  label: string
  className?: string
}

export function Sheet({ children, position = 'right', label, className = '' }: SheetProps) {
  // Phone sheets stop just above the quick-travel strip so a child can still hop
  // between worlds while a panel is open. From `sm` up they become drawers.
  const positionClasses =
    position === 'center'
      ? 'inset-x-2 bottom-48 max-h-[46vh] sm:inset-x-auto sm:max-h-none sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2'
      : position === 'bottom'
        ? 'inset-x-2 bottom-48 max-h-[52vh] sm:inset-x-auto sm:max-h-none sm:right-4 sm:bottom-44 sm:w-[22rem]'
        : 'inset-x-2 bottom-48 max-h-[52vh] sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-44 sm:w-[24rem] sm:max-h-none'

  return (
    <motion.aside
      role="dialog"
      aria-label={label}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`sse-panel sse-scroll pointer-events-auto fixed z-30 overflow-y-auto p-4 ${positionClasses} ${className}`}
    >
      {children}
    </motion.aside>
  )
}