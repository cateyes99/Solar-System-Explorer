import { useId } from 'react'
import type { ReactNode } from 'react'

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
  accent = 'cyan',
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
  hint?: ReactNode
  accent?: 'cyan' | 'warm'
}) {
  const id = useId()
  const text = format ? format(value) : String(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-medium text-ice-200/85">
          {label}
        </label>
        <span
          className={`font-mono text-[12px] tabular-nums ${
            accent === 'warm' ? 'text-solar' : 'text-cyan-200'
          }`}
        >
          {text}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={text}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
        style={{ accentColor: accent === 'warm' ? 'var(--color-solar)' : 'var(--color-cyan-glow)' }}
      />
      {hint && <p className="text-[11px] leading-snug text-ice-400/75">{hint}</p>}
    </div>
  )
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: ReactNode
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <label htmlFor={id} className="flex items-center gap-2 text-[13px] font-medium text-ice-100">
          {icon}
          {label}
        </label>
        {description && <p className="mt-0.5 text-[11px] leading-snug text-ice-400/75">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-edge-strong bg-cyan-glow/35' : 'border-edge bg-white/8',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
            checked ? 'left-[24px] bg-cyan-glow' : 'left-1 bg-ice-200',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

/** Small pill used for planet types, moon counts and metadata. */
export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'cyan' | 'warm' | 'muted'
}) {
  const tones = {
    neutral: 'border-edge text-ice-200/85',
    cyan: 'border-cyan-glow/35 text-cyan-200',
    warm: 'border-solar/40 text-solar',
    muted: 'border-transparent bg-white/5 text-ice-400',
  } as const
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-0 border-t border-edge" />
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-0 border-t border-edge" />
      <span className="eyebrow">{label}</span>
      <hr className="flex-1 border-0 border-t border-edge" />
    </div>
  )
}