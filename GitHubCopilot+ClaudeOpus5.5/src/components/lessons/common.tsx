import type { ReactNode } from 'react'
import { Icon } from '../ui/Icon'

export function LessonSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <div className="mt-1.5 space-y-2 text-[15px] leading-relaxed text-slate-300">{children}</div>
    </section>
  )
}

export function ModelBadge({ children = 'Simplified model – not to scale' }: { children?: ReactNode }) {
  return (
    <span className="chip bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/25">
      <Icon name="lightbulb" size={12} /> {children}
    </span>
  )
}

export function Figure({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="mt-3 rounded-2xl border border-white/8 bg-space-950/60 p-3">
      {children}
      {caption && <figcaption className="mt-2 text-center text-sm text-slate-400">{caption}</figcaption>}
    </figure>
  )
}

export function FactPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-3 text-center">
      <div className="font-display text-xl font-bold text-amber-200">{value}</div>
      <div className="mt-0.5 text-xs leading-snug text-slate-400">{label}</div>
    </div>
  )
}

export function PlayButton({ playing, onToggle, label }: { playing: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" className="btn btn-icon shrink-0" onClick={onToggle} aria-label={playing ? `Pause ${label}` : `Play ${label}`}>
      <Icon name={playing ? 'pause' : 'play'} size={18} />
    </button>
  )
}
