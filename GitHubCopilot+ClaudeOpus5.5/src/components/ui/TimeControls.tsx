import { SPEED_PRESETS, useSimulationStore } from '../../store/simulationStore'
import { daysToDate } from '../../utils/astronomy'
import { formatDate, formatNumber, formatSpeedLabel } from '../../utils/format'
import { Icon } from './Icon'

const JUMPS = [
  { label: '+1 day', days: 1 },
  { label: '+1 month', days: 30.44 },
  { label: '+1 year', days: 365.25 },
]

function speedMultiplier(daysPerSecond: number): string {
  return `${formatNumber(daysPerSecond, daysPerSecond < 1 ? 2 : 0)}×`
}

export function TimeControls() {
  const paused = useSimulationStore((s) => s.paused)
  const daysPerSecond = useSimulationStore((s) => s.daysPerSecond)
  const displayDays = useSimulationStore((s) => s.displayDays)
  const appMode = useSimulationStore((s) => s.appMode)
  const togglePause = useSimulationStore((s) => s.togglePause)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const advanceDays = useSimulationStore((s) => s.advanceDays)
  const jumpToToday = useSimulationStore((s) => s.jumpToToday)

  if (appMode === 'tour' || appMode === 'mission') return null

  const date = formatDate(daysToDate(displayDays))
  const presetIndex = SPEED_PRESETS.findIndex((p) => Math.abs(p.daysPerSecond - daysPerSecond) < 1e-6)
  const cycleSpeed = () => {
    const next = SPEED_PRESETS[(presetIndex + 1) % SPEED_PRESETS.length]
    setSpeed(next.daysPerSecond)
  }
  const speedText = paused ? 'Paused' : `Simulation speed: ${speedMultiplier(daysPerSecond)}`

  return (
    <section
      aria-label="Time controls"
      className="glass pointer-events-auto fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[820px] -translate-x-1/2 rounded-3xl px-3 py-2.5 sm:px-4"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={togglePause}
          className="btn-primary btn-icon h-12 w-12 shrink-0 p-0"
          aria-label={paused ? 'Play simulation' : 'Pause simulation'}
        >
          <Icon name={paused ? 'play' : 'pause'} size={22} />
        </button>

        <div className="min-w-0 shrink-0">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Simulated date</div>
          <div className="font-display text-base font-bold text-white tabular-nums sm:text-lg" aria-live="off">
            {date}
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex" role="group" aria-label="Simulation speed">
          {SPEED_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="btn px-3"
              aria-pressed={!paused && presetIndex >= 0 && SPEED_PRESETS[presetIndex].id === preset.id}
              onClick={() => setSpeed(preset.daysPerSecond)}
              title={formatSpeedLabel(preset.daysPerSecond)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <button type="button" className="btn ml-auto shrink-0 md:hidden" onClick={cycleSpeed} aria-label={`Change speed. ${speedText}`}>
          <Icon name="motion" size={18} />
          {presetIndex >= 0 ? SPEED_PRESETS[presetIndex].label : speedMultiplier(daysPerSecond)}
        </button>

        <div className="hidden items-center gap-1 lg:flex" role="group" aria-label="Jump forward in time">
          {JUMPS.map((jump) => (
            <button key={jump.label} type="button" className="btn px-3" onClick={() => advanceDays(jump.days)}>
              {jump.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-icon hidden shrink-0 sm:inline-flex lg:hidden" onClick={() => advanceDays(30.44)} aria-label="Jump forward one month">
          <Icon name="plus" size={18} />
        </button>
        <button type="button" className="btn btn-icon shrink-0" onClick={jumpToToday} aria-label="Go back to today" title="Today">
          <Icon name="today" size={18} />
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-2 text-center text-xs text-slate-400" aria-live="polite">
        <span className="font-semibold text-cyan-200">{speedText}</span>
        {!paused && <span aria-hidden="true">·</span>}
        {!paused && <span>{formatSpeedLabel(daysPerSecond)}</span>}
      </div>
    </section>
  )
}
