import { CalendarDays, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { getSimulationDate, jumpClock, resetClock, SPEEDS } from '../../utils/simulationClock'

export function TimeControls() {
  const speedIndex = useSimulationStore((state) => state.speedIndex)
  const isPlaying = useSimulationStore((state) => state.isPlaying)
  const simulationDays = useSimulationStore((state) => state.simulationDays)
  const setSpeedIndex = useSimulationStore((state) => state.setSpeedIndex)
  const togglePlaying = useSimulationStore((state) => state.togglePlaying)
  const publishSimulationDays = useSimulationStore((state) => state.publishSimulationDays)
  const speed = SPEEDS[speedIndex]
  const date = getSimulationDate(simulationDays)

  const advance = () => {
    publishSimulationDays(jumpClock(1))
  }
  const reset = () => {
    resetClock()
    publishSimulationDays(0)
  }

  return (
    <section className="time-controls glass" aria-label="Simulation time controls">
      <div className="time-controls__primary">
        <button className="play-button" onClick={togglePlaying} aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}>
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>
        <div className="time-status"><span className={`status-dot ${isPlaying ? '' : 'paused'}`} /><span>{isPlaying ? 'LIVE' : 'PAUSED'}</span></div>
      </div>
      <div className="time-divider" />
      <div className="speed-options" aria-label="Simulation speed">
        {SPEEDS.map((item, index) => (
          <button key={item.name} className={speedIndex === index ? 'active' : ''} onClick={() => setSpeedIndex(index)} aria-pressed={speedIndex === index} title={`${item.daysPerSecond} simulated days per second`}>
            <span>{item.name === 'Very fast' ? '365×' : item.name}</span>
          </button>
        ))}
      </div>
      <button className="mobile-speed" onClick={() => setSpeedIndex((speedIndex + 1) % SPEEDS.length)} aria-label={`Speed ${speed.name}. Change speed`}>{speed.daysPerSecond}×</button>
      <div className="time-divider time-divider--second" />
      <div className="simulation-date">
        <CalendarDays size={16} />
        <div><span>SIMULATION DATE</span><time dateTime={date.toISOString()}>{date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</time></div>
      </div>
      <button className="advance-button" onClick={advance} aria-label="Advance one simulated day" title="Advance one day"><ChevronRight size={17} /><span>1 day</span></button>
      <button className="icon-button reset-time" onClick={reset} aria-label="Reset simulation date" title="Reset date"><RotateCcw size={15} /></button>
      <div className="speed-readout">Simulation speed: <strong>{speed.daysPerSecond === 365 ? '365×' : `${speed.daysPerSecond} day/s`}</strong></div>
    </section>
  )
}
