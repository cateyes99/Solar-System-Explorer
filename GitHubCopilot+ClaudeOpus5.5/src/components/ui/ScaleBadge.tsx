import { useSimulationStore } from '../../store/simulationStore'
import { SCALE_MODES } from '../../utils/scale'
import { Icon } from './Icon'

/** Constant reminder that the view is not to scale, doubling as a shortcut to the scale settings. */
export function ScaleBadge() {
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const appMode = useSimulationStore((s) => s.appMode)
  const is2D = useSimulationStore((s) => s.renderMode === '2d')
  const setSettingsOpen = useSimulationStore((s) => s.setSettingsOpen)
  if (appMode === 'mission' || is2D) return null
  const label = SCALE_MODES.find((m) => m.id === scaleMode)?.label ?? ''
  return (
    <button
      type="button"
      onClick={() => setSettingsOpen(true)}
      className="glass-soft pointer-events-auto fixed top-[4.6rem] left-3 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:text-white sm:top-[5rem] lg:top-auto lg:right-4 lg:bottom-4 lg:left-auto"
      aria-label={`Not to scale. Current view: ${label}. Change scale settings`}
    >
      <Icon name="question" size={14} />
      <span>Not to scale</span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-300">{label}</span>
    </button>
  )
}
