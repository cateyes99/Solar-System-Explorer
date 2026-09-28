interface ToggleProps {
  label: string
  checked: boolean
  onChange: () => void
}

/** A reusable accessible switch built on a native checkbox for correct keyboard/AT behavior. */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
      <span className="text-sm text-white/85">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-white/20 transition-colors peer-checked:bg-electric-blue" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}
