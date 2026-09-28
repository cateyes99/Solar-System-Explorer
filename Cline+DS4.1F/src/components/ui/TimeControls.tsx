import { useSimulationStore, simulationDaysPerSecond } from '../../store/simulationStore'
import { TIME_SPEEDS } from '../../data/missions'
import { useSimulationTime } from '../../hooks/useSimulationTime'
import { formatDaysPerSecond, formatSimDate, formatSpeedMultiplier } from '../../utils/format'
import { IconButton, ToolbarButton } from './primitives'
import { BackIcon, ForwardIcon, PauseIcon, PlayIcon, SunIcon } from './icons'

/**
 * Time controls.
 *
 * Pause, play, slow down, speed up and jump straight to today. The simulated
 * date is always on screen, and the speed is spelled out in two ways: "1 day per
 * second" for the child, and "86,400× real time" for the curious grown-up.
 */
export function TimeControls() {
  const paused = useSimulationStore((state) => state.paused)
  const togglePaused = useSimulationStore((state) => state.togglePaused)
  const speedIndex = useSimulationStore((state) => state.speedIndex)
  const setSpeedIndex = useSimulationStore((state) => state.setSpeedIndex)
  const direction = useSimulationStore((state) => state.direction)
  const setDirection = useSimulationStore((state) => state.setDirection)
  const nudgeDays = useSimulationStore((state) => state.nudgeDays)
  const resetToToday = useSimulationStore((state) => state.resetToToday)
  const setSimulationDate = useSimulationStore((state) => state.setSimulationDate)
  const daysPerSecond = useSimulationStore((state) => simulationDaysPerSecond(state))
  const { date } = useSimulationTime()

  const speed = TIME_SPEEDS[speedIndex] ?? TIME_SPEEDS[1]
  const isoDate = date.toISOString().slice(0, 10)

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={togglePaused}
        aria-pressed={!paused}
        aria-label={paused ? 'Play the simulation' : 'Pause the simulation'}
        className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
          paused
            ? 'border-electric/60 bg-electric/90 text-white hover:bg-electric'
            : 'border-white/15 bg-white/8 text-parchment hover:bg-white/14'
        }`}
      >
        <span aria-hidden="true">{paused ? <PlayIcon size={20} /> : <PauseIcon size={20} />}</span>
        <span className="hidden sm:inline">{paused ? 'Play' : 'Pause'}</span>
      </button>

      <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/4 p-1">
        <IconButton label="Slower simulation" icon={<BackIcon />} onClick={() => setSpeedIndex(speedIndex - 1)} />
        <div className="min-w-[6.5rem] px-1 text-center sm:min-w-[9rem]">
          <div className="sse-numeric text-sm font-semibold text-parchment">
            {paused ? 'Paused' : `${speed.label}`}
          </div>
          <div className="sse-numeric text-[0.62rem] text-mist/90">
            {paused ? speed.shortLabel : formatDaysPerSecond(Math.abs(daysPerSecond))}
          </div>
        </div>
        <IconButton label="Faster simulation" icon={<ForwardIcon />} onClick={() => setSpeedIndex(speedIndex + 1)} />
      </div>

      <div className="hidden flex-col leading-tight sm:flex">
        <span className="sse-label-text text-[0.58rem]">Simulation speed</span>
        <span className="sse-numeric text-xs text-ice">
          {paused ? '0' : formatSpeedMultiplier(Math.abs(daysPerSecond))}
        </span>
      </div>

      <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/4 p-1 lg:flex">
        <button
          type="button"
          onClick={() => nudgeDays(-1)}
          className="min-h-[2.4rem] rounded-lg px-2.5 text-xs text-mist transition-colors hover:bg-white/10 hover:text-parchment"
        >
          −1 day
        </button>
        <button
          type="button"
          onClick={() => nudgeDays(1)}
          className="min-h-[2.4rem] rounded-lg px-2.5 text-xs text-mist transition-colors hover:bg-white/10 hover:text-parchment"
        >
          +1 day
        </button>
        <button
          type="button"
          onClick={() => setDirection(direction === 1 ? -1 : 1)}
          aria-pressed={direction === -1}
          className={`min-h-[2.4rem] rounded-lg px-2.5 text-xs transition-colors ${
            direction === -1 ? 'bg-violet/30 text-parchment' : 'text-mist hover:bg-white/10 hover:text-parchment'
          }`}
        >
          ↺ Time travel
        </button>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-1.5">
          <span className="sse-label-text text-[0.58rem]">Date</span>
          <input
            type="date"
            value={isoDate}
            onChange={(event) => {
              const value = event.target.value
              if (!value) return
              const parsed = Date.parse(`${value}T12:00:00Z`)
              if (Number.isFinite(parsed)) setSimulationDate(parsed)
            }}
            className="sse-numeric w-[8.4rem] bg-transparent text-sm text-parchment outline-none"
          />
        </label>
        <span className="sse-numeric hidden text-xs text-mist sm:inline">{formatSimDate(date.getTime())}</span>
        <ToolbarButton icon={<SunIcon size={16} />} compact onClick={resetToToday} title="Jump back to today">
          Today
        </ToolbarButton>
      </div>
    </div>
  )
}