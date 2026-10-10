import { useSimulationStore } from '../../store/simulationStore'
import { SPEED_PRESETS } from '../../utils/clock'

export function TimeControls() {
  const speed = useSimulationStore((s) => s.speed)
  const paused = useSimulationStore((s) => s.paused)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const togglePaused = useSimulationStore((s) => s.togglePaused)

  return (
    <div className="time-controls glass" role="group" aria-label="Simulation time controls">
      <button onClick={togglePaused} aria-label={paused ? 'Play simulation' : 'Pause simulation'} className="play-btn">
        {paused ? '▶' : '⏸'}
      </button>
      {SPEED_PRESETS.map((p) => (
        <button
          key={p.label}
          className={!paused && speed === p.daysPerSecond ? 'active' : ''}
          onClick={() => setSpeed(p.daysPerSecond)}
        >
          {p.label}
        </button>
      ))}
      <div className="sim-readout">
        <span id="sim-date" aria-live="off">—</span>
        <span className="sim-speed">
          {paused ? 'Paused' : `Simulation speed: ${speed}× (1s = ${speed >= 1 ? `${speed} days` : `${(1 / speed).toFixed(0)}s per day`})`}
        </span>
      </div>
    </div>
  )
}
