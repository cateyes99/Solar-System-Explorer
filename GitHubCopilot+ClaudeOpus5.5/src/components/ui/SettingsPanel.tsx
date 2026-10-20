import type { ReactNode } from 'react'
import { useSimulationStore, type Quality } from '../../store/simulationStore'
import { SCALE_MODES, type CustomScale } from '../../utils/scale'
import { Modal } from './Modal'

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-4 rounded-2xl px-3 py-2 hover:bg-white/5">
      <span className="flex-1">
        <span className="block font-semibold text-white">{label}</span>
        {description && <span className="block text-sm text-slate-400">{description}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-sky-500 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
      />
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  left,
  right,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  left: string
  right: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input type="range" className="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="flex justify-between text-xs text-slate-400">
        <span>{left}</span>
        <span>{right}</span>
      </span>
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function SettingsPanel() {
  const open = useSimulationStore((s) => s.settingsOpen)
  const setOpen = useSimulationStore((s) => s.setSettingsOpen)
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const setScaleMode = useSimulationStore((s) => s.setScaleMode)
  const custom = useSimulationStore((s) => s.customScale)
  const setCustom = useSimulationStore((s) => s.setCustomScale)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const toggleLabels = useSimulationStore((s) => s.toggleLabels)
  const showOrbits = useSimulationStore((s) => s.showOrbits)
  const toggleOrbits = useSimulationStore((s) => s.toggleOrbits)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const setReducedMotion = useSimulationStore((s) => s.setReducedMotion)
  const quality = useSimulationStore((s) => s.quality)
  const setQuality = useSimulationStore((s) => s.setQuality)
  const sound = useSimulationStore((s) => s.sound)
  const setSound = useSimulationStore((s) => s.setSound)
  const setHelpOpen = useSimulationStore((s) => s.setHelpOpen)

  const patch = (p: Partial<CustomScale>) => setCustom(p)

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings" size="lg">
      <Section title="Scale – how the Solar System is drawn">
        <p className="mb-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-sm leading-relaxed text-amber-50">
          <strong>Not to scale!</strong> The real Solar System is so huge and empty that, drawn accurately, the planets would be
          smaller than a single pixel. These views stretch sizes and squeeze distances so you can see everything.
        </p>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Scale mode">
          {SCALE_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={scaleMode === mode.id}
              onClick={() => setScaleMode(mode.id)}
              className={`rounded-2xl border p-3 text-left transition ${
                scaleMode === mode.id ? 'border-sky-300/60 bg-sky-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
              }`}
            >
              <span className="block font-semibold text-white">{mode.label}</span>
              <span className="mt-1 block text-sm leading-snug text-slate-400">{mode.description}</span>
            </button>
          ))}
        </div>
        {scaleMode === 'custom' && (
          <div className="mt-3 grid gap-3 rounded-2xl bg-white/[0.04] p-4 sm:grid-cols-2">
            <Slider label="Planet size" value={custom.planetSize} min={0.3} max={2.5} step={0.05} onChange={(v) => patch({ planetSize: v })} left="Tiny" right="Huge" />
            <Slider label="Size realism" value={custom.sizeRealism} min={0.3} max={1} step={0.05} onChange={(v) => patch({ sizeRealism: v })} left="Similar sizes" right="True sizes" />
            <Slider label="Distance spread" value={custom.distanceSpread} min={0.5} max={2} step={0.05} onChange={(v) => patch({ distanceSpread: v })} left="Close" right="Far" />
            <Slider label="Distance realism" value={custom.distanceRealism} min={0.4} max={1} step={0.05} onChange={(v) => patch({ distanceRealism: v })} left="Squeezed" right="True spacing" />
          </div>
        )}
      </Section>

      <Section title="Display">
        <Toggle label="Planet labels" description="Show names next to planets" checked={showLabels} onChange={toggleLabels} />
        <Toggle label="Orbit lines" description="Show the paths planets travel" checked={showOrbits} onChange={toggleOrbits} />
        <div className="mt-2 px-3">
          <span className="block font-semibold text-white">Graphics quality</span>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Graphics quality">
            {(['high', 'balanced', 'low'] as Quality[]).map((q) => (
              <button key={q} type="button" role="radio" aria-checked={quality === q} className={`btn flex-1 capitalize ${quality === q ? 'btn-active' : ''}`} onClick={() => setQuality(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Comfort">
        <Toggle
          label="Reduce motion"
          description="Shorter camera moves, no twinkling or auto-rotation, calmer effects"
          checked={reducedMotion}
          onChange={setReducedMotion}
        />
      </Section>

      <Section title="Sound">
        <Toggle label="Sound" description="Off until you switch it on" checked={sound.enabled} onChange={(v) => setSound({ enabled: v })} />
        <div className={sound.enabled ? '' : 'pointer-events-none opacity-50'} aria-disabled={!sound.enabled}>
          <Toggle label="Ambient space hum" checked={sound.ambient} onChange={(v) => setSound({ ambient: v })} />
          <Toggle label="Button sounds" checked={sound.ui} onChange={(v) => setSound({ ui: v })} />
          <Toggle label="Cinematic whooshes" checked={sound.cinematic} onChange={(v) => setSound({ cinematic: v })} />
        </div>
      </Section>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setOpen(false)
            setHelpOpen(true)
          }}
        >
          Keyboard shortcuts
        </button>
      </div>
    </Modal>
  )
}
