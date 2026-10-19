import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion, useDragControls } from 'framer-motion'
import type { MotionProps } from 'framer-motion'
import { useTranslation } from '../../i18n'
import { ChevronIcon } from './icons'

/**
 * Small, reusable interface pieces.
 *
 * Everything is a real HTML element with an accessible name, sized for both a
 * mouse and a thumb (a 44px minimum touch target), and styled with the shared
 * glass-panel tokens so panels stay consistent.
 */

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

/**
 * Shared placement for the floating sheets.
 *
 * Phone sheets stop just above the quick-travel strip so a child can still hop
 * between worlds while a panel is open; from `sm` up they become drawers or a
 * centred card.
 */
const SHEET_POSITION_CLASSES: Record<'right' | 'bottom' | 'center', string> = {
  center:
    'inset-x-2 bottom-48 max-h-[46vh] sm:inset-x-auto sm:max-h-none sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2',
  bottom:
    'inset-x-2 bottom-48 max-h-[52vh] sm:inset-x-auto sm:max-h-none sm:right-4 sm:bottom-44 sm:w-[22rem]',
  right:
    'inset-x-2 bottom-48 max-h-[52vh] sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-44 sm:w-[24rem] sm:max-h-none',
}

interface SheetProps {
  children: ReactNode
  /** A right-hand drawer on desktop, a bottom sheet on phones. */
  position?: 'right' | 'bottom' | 'center'
  label: string
  className?: string
}

export function Sheet({ children, position = 'right', label, className = '' }: SheetProps) {
  return (
    <motion.aside
      role="dialog"
      aria-label={label}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`sse-panel sse-scroll pointer-events-auto fixed z-30 overflow-y-auto p-4 ${SHEET_POSITION_CLASSES[position]} ${className}`}
    >
      {children}
    </motion.aside>
  )
}

type DraggableSheetProps = {
  children: ReactNode
  /** Accessible name for the panel. */
  label: string
  /** A plain region for narration, a dialog for interactive panels. */
  role?: 'dialog' | 'region'
  /** One of the shared sheet positions, or `none` to place it entirely via `className`. */
  position?: 'right' | 'bottom' | 'center' | 'none'
  /** Extra fixed-position classes (width, top/left …). */
  className?: string
  /** Header content. Doubles as the drag handle, and fades with the panel. */
  header: ReactNode
  /** Controls beside the header (a close button, a status chip …). Never faded. */
  headerActions?: ReactNode
  /** Decorative layer painted behind the content but above the glass. */
  backdrop?: ReactNode
  /** Padding etc. for the scrollable body. */
  bodyClassName?: string
  /** 0…1 opacity applied to the glass and the body — never to the controls. */
  opacity: number
  onOpacityChange: (value: number) => void
} & MotionProps

/**
 * A floating glass panel that can be dragged around and faded to taste.
 *
 * Dragging only ever starts from the header (the drag handle), so buttons,
 * sliders and text in the body never move the panel by accident. The opacity
 * slider lives outside the faded layers — exactly like
 * {@link CollapsibleSidePanel} — so a panel left at 0% can always be brought
 * back into view. Position and opacity are local to each instance, so moving or
 * fading one panel never touches another.
 */
export function DraggableSheet({
  children,
  label,
  role = 'dialog',
  position = 'none',
  className = '',
  header,
  headerActions,
  backdrop,
  bodyClassName = 'px-4 pb-4',
  opacity,
  onOpacityChange,
  initial = { opacity: 0, y: 18 },
  animate = { opacity: 1, y: 0 },
  exit = { opacity: 0, y: 18 },
  transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  ...motionProps
}: DraggableSheetProps) {
  const dragControls = useDragControls()
  const positionClasses = position === 'none' ? '' : SHEET_POSITION_CLASSES[position]

  return (
    <motion.aside
      role={role}
      aria-label={label}
      {...motionProps}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      className={`pointer-events-auto fixed z-30 flex flex-col overflow-hidden rounded-[var(--radius-panel)] ${positionClasses} ${className}`}
    >
      {/*
        Entrance and exit live on this inner layer, clear of the drag transform,
        so a panel the user has dragged still animates out from where it sits.
      */}
      <motion.div
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        {/* The glass, on its own layer so it can fade independently of the controls. */}
        <div className="sse-panel absolute inset-0" style={{ opacity }} aria-hidden="true" />
        {backdrop ? (
          <div className="pointer-events-none absolute inset-0" style={{ opacity }} aria-hidden="true">
            {backdrop}
          </div>
        ) : null}

        {/* The header is the drag handle; the actions beside it never start a drag. */}
        <div
          onPointerDown={(event) => dragControls.start(event)}
          className="relative flex shrink-0 cursor-grab touch-none select-none items-start justify-between gap-2 px-4 pt-4 pb-2 active:cursor-grabbing"
        >
          <div className="min-w-0" style={{ opacity }}>
            {header}
          </div>
          <div
            className="flex shrink-0 items-center gap-1.5"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {headerActions}
          </div>
        </div>

        {/* The opacity slider is a control, so it sits outside the faded layer too. */}
        <div className="relative shrink-0 px-4 pb-3">
          <PanelOpacityControl value={opacity} onChange={onOpacityChange} />
        </div>

        <div
          className={`sse-scroll relative min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}
          style={{ opacity }}
        >
          {children}
        </div>
      </motion.div>
    </motion.aside>
  )
}

interface PanelCollapseButtonProps {
  side: 'left' | 'right'
  label: string
  onToggle: () => void
  className?: string
}

/**
 * The chevron that folds an expanded side panel away. It points toward the edge
 * the panel is anchored to, so "collapse" reads as "slide that way".
 */
export function PanelCollapseButton({
  side,
  label,
  onToggle,
  className = '',
}: PanelCollapseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:bg-white/12 hover:text-parchment ${className}`}
    >
      <span aria-hidden="true">
        <ChevronIcon size={16} direction={side} />
      </span>
    </button>
  )
}

interface PanelOpacityControlProps {
  value: number
  onChange: (value: number) => void
}

/**
 * A compact opacity slider that sits in a side panel's header.
 *
 * It is deliberately kept outside the part of the panel that fades, so it stays
 * readable and grabbable even when the panel itself has been slid to 0%.
 */
export function PanelOpacityControl({ value, onChange }: PanelOpacityControlProps) {
  const { t } = useTranslation()
  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-2.5 py-1.5">
      <span className="sse-label-text text-[0.58rem]">{t('ui.opacity')}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={t('ui.panelOpacity')}
        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-ice"
      />
      <span className="sse-numeric w-8 text-right text-[0.62rem] text-mist">
        {Math.round(value * 100)}%
      </span>
    </label>
  )
}

type CollapsibleSidePanelProps = {
  children: ReactNode
  /** Which screen edge the panel is anchored to. */
  side: 'left' | 'right'
  /** Accessible name for the panel. */
  label: string
  /** Short text shown on the collapsed bar. */
  collapsedLabel: string
  collapsed: boolean
  onToggle: () => void
  /** Fixed-position classes (top/bottom/left/right, visibility). Width is handled here. */
  className?: string
  /** Width classes while expanded, e.g. `w-[19rem] lg:w-[20.5rem]`. */
  expandedWidthClass: string
  /** Width classes while collapsed. Defaults to a narrow bar. */
  collapsedWidthClass?: string
  /** Padding etc. for the scrollable content area. */
  bodyClassName?: string
  /** ARIA role: a plain side region, or a dialog for information panels. */
  role?: 'complementary' | 'dialog'
  /** 0…1 opacity of the panel's background and body. The header's controls never fade. */
  opacity?: number
  /** When supplied, an opacity slider is shown in the header while expanded. */
  onOpacityChange?: (value: number) => void
  /** Header content — the title block. Fades with the panel. */
  header?: ReactNode
  /** Extra header controls (e.g. a close button). Never faded. */
  headerActions?: ReactNode
} & MotionProps

/**
 * A floating glass panel anchored to a screen edge that can be folded away.
 *
 * Expanded, it behaves like the old `Panel`/`Sheet`: a fixed, scrollable card.
 * Collapsed, it shrinks to a narrow vertical bar — itself a button — hugging the
 * edge. The width is animated with a plain CSS transition, so the browser's own
 * reduced-motion rules apply for free. On phones these panels are full-width
 * bottom sheets, so the collapsed bar is suppressed there and the panel simply
 * stays expanded.
 *
 * The optional opacity slider fades the panel's background and body. The header
 * controls — the opacity slider, the collapse chevron and any `headerActions` —
 * sit outside the faded layer, so they stay fully usable even at 0%. A collapsed
 * panel is likewise kept solid: its bar is a control.
 */
export function CollapsibleSidePanel({
  children,
  side,
  label,
  collapsedLabel,
  collapsed,
  onToggle,
  className = '',
  expandedWidthClass,
  collapsedWidthClass = 'w-12',
  bodyClassName = 'px-4 pb-4',
  role = 'complementary',
  opacity = 1,
  onOpacityChange,
  header,
  headerActions,
  ...motionProps
}: CollapsibleSidePanelProps) {
  // On the collapsed bar the chevron points away from the edge — toward the
  // middle of the screen — so it reads as "pull the panel back out".
  const expandDirection = side === 'left' ? 'right' : 'left'
  // A folded panel is just a handle, so it never fades; that keeps it clickable
  // whatever the slider was left at.
  const faded = collapsed ? 1 : opacity
  return (
    <motion.aside
      role={role}
      aria-label={label}
      {...motionProps}
      className={`pointer-events-auto fixed z-30 flex flex-col overflow-hidden transition-[width,top] duration-300 ease-out ${
        collapsed ? collapsedWidthClass : expandedWidthClass
      } ${className}`}
    >
      {/* The glass, on its own layer so it can fade independently of the controls. */}
      <div className="sse-panel absolute inset-0" style={{ opacity: faded }} aria-hidden="true" />

      <div
        className={`relative flex shrink-0 items-start justify-between gap-2 px-4 pt-4 ${
          !collapsed && onOpacityChange ? 'pb-2' : 'pb-3'
        } ${collapsed ? 'sm:hidden' : ''}`}
      >
        <div className="min-w-0" style={{ opacity: faded }}>
          {header}
        </div>
        {/* Controls: never faded, so the panel can always be adjusted or closed. */}
        <div className="flex shrink-0 items-center gap-1.5">{headerActions}</div>
      </div>

      {/* The opacity slider is a control, so it sits outside the faded layer too. */}
      {!collapsed && onOpacityChange ? (
        <div className="relative shrink-0 px-4 pb-3">
          <PanelOpacityControl value={opacity} onChange={onOpacityChange} />
        </div>
      ) : null}

      {/* Kept mounted while collapsed (just hidden from `sm` up) so panel state
          and scroll position survive a fold. */}
      <div
        className={`sse-scroll relative min-h-0 flex-1 overflow-y-auto ${bodyClassName} ${
          collapsed ? 'sm:hidden' : ''
        }`}
        style={{ opacity: faded }}
      >
        {children}
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Expand ${label}`}
          title={`Expand ${label}`}
          className="relative hidden min-h-0 flex-1 flex-col items-center justify-center gap-3 px-1 text-mist transition-colors hover:bg-white/6 hover:text-parchment sm:flex"
        >
          <span aria-hidden="true">
            <ChevronIcon size={16} direction={expandDirection} />
          </span>
          <span className="whitespace-nowrap text-[0.66rem] uppercase tracking-[0.24em] [writing-mode:vertical-rl]">
            {collapsedLabel}
          </span>
        </button>
      ) : null}
    </motion.aside>
  )
}