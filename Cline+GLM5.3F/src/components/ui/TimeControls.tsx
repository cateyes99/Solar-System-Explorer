import { audio } from '../../audio/audioEngine'
import { useSimulation } from '../../store/simulationStore'
import { useSimulationDate } from '../../hooks/useSimulationDate'
import { SPEEDS, simClock } from '../../utils/clock'

/** Bottom timeline: play/pause, speed, simulated date, time jumps, view controls. */
export function TimeControls(): JSX.Element {
  const paused = useSimulation((s) => s.paused)
  const togglePaused = useSimulation((s) => s.togglePaused)
  const speedIndex = useSimulation((s) => s.speedIndex)
  const setSpeedIndex = useSimulation((s) => s.setSpeedIndex)
  const focus = useSimulation((s) => s.focus)
  const focusSystem = useSimulation((s) => s.focusSystem)
  const selectedBody = useSimulation((s) => s.selectedBody)
  const { dateText, bump } = useSimulationDate()

  const jump = (days: number): void => {
    simClock.advance(days)
    bump()
    audio.blip(600)
  }

  const speed = SPEEDS[speedIndex]

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 p-3 pb-safe md:p-4">
      <p className="hidden text-[11px] text-white/40 md:block">
        This visualization is <span className="text-white/60">not to scale</span> — it's built for learning, not navigation 😊
      </p>
      <div className="glass pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 rounded-2xl px-3 py-2">
        <button
          type="button"
          className="btn !px-3"
          onClick={() => {
            togglePaused()
            audio.blip(paused ? 880 : 440)
          }}
          aria-label={paused ? 'Play simulation' : 'Pause simulation'}
        >
          <span aria-hidden>{paused ? '▶' : '⏸'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Simulation speed">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={`chip max-md:px-2 ${i === speedIndex ? 'chip-active' : ''}`}
              onClick={() => {
                setSpeedIndex(i)
                audio.blip(700)
              }}
              aria-pressed={i === speedIndex}
            >
              {s.label}
            </button>
          ))}
        </div>

        <span className="hidden text-xs text-white/50 xl:inline">
          Simulation speed: <span className="text-astro-cyan">{speed.multiplier}</span>
          <span className="text-white/35">
            {' '}({speed.daysPerSecond} {speed.daysPerSecond === 1 ? 'day' : 'days'}/sec)
          </span>
        </span>

        <div className="mx-1 hidden h-6 w-px bg-white/10 md:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white/85" aria-live="polite">
            📅 {dateText}
          </span>
          <button type="button" className="chip max-md:px-2" onClick={() => jump(1)} aria-label="Advance one day">
            +1d
          </button>
          <button type="button" className="chip max-md:px-2" onClick={() => jump(30.44)} aria-label="Advance one month">
            +1mo
          </button>
          <button type="button" className="chip max-md:px-2" onClick={() => jump(365.25)} aria-label="Advance one year">
            +1y
          </button>
          <button
            type="button"
            className="chip max-md:px-2"
            onClick={() => {
              simClock.reset()
              bump()
            }}
            aria-label="Reset simulation date to today"
          >
            ↺
          </button>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-white/10 md:block" />

        <button
          type="button"
          className={`btn max-md:px-2.5 ${focus.mode === 'system' ? 'chip-active' : ''}`}
          onClick={() => {
            focusSystem()
            audio.blip(520)
          }}
          aria-label="View the whole Solar System"
        >
          <span aria-hidden>🌌</span>
          <span className="hidden sm:inline">View Solar System</span>
        </button>

        {selectedBody && focus.mode === 'body' && (
          <button
            type="button"
            className="btn max-md:px-2.5"
            onClick={() => useSimulation.getState().focusBody(selectedBody, { follow: true })}
          >
            <span aria-hidden>📌</span>
            <span className="hidden sm:inline">Follow</span>
          </button>
        )}
        {focus.mode === 'follow' && <span className="chip chip-active">Following</span>}
      </div>
      <p className="text-[10px] text-white/35 md:hidden">Drag to explore • Tap a planet to learn</p>
    </div>
  )
}
