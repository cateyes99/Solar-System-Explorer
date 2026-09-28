import { useEffect, useState } from 'react'
import { useSimulationStore, SPEED_PRESETS, type SpeedPreset } from '../../store/simulationStore'
import { simDateFromDays, formatSimDate } from '../../utils/astronomy'
import { PlayIcon, PauseIcon } from './icons'

const SLIDER_MIN = -3650
const SLIDER_MAX = 3650

/** Bottom timeline: play/pause, speed presets, current simulated date, and a time-scrub slider. */
export function TimeControls() {
  const isPaused = useSimulationStore((s) => s.isPaused)
  const speedPreset = useSimulationStore((s) => s.speedPreset)
  const togglePaused = useSimulationStore((s) => s.togglePaused)
  const setSpeedPreset = useSimulationStore((s) => s.setSpeedPreset)
  const setSimTimeDays = useSimulationStore((s) => s.setSimTimeDays)

  const [displayDays, setDisplayDays] = useState(() => useSimulationStore.getState().simTimeDays)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayDays(useSimulationStore.getState().simTimeDays)
    }, 150)
    return () => clearInterval(interval)
  }, [])

  const currentDate = formatSimDate(simDateFromDays(displayDays))
  const sliderValue = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, displayDays))

  return (
    <div className="glass-panel pointer-events-auto flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:gap-5">
      <button
        type="button"
        onClick={() => togglePaused()}
        aria-label={isPaused ? 'Play' : 'Pause'}
        className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full bg-electric-blue/20 text-white ring-1 ring-electric-blue/50 transition hover:bg-electric-blue/30"
      >
        {isPaused ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-white/70">
          <span>{currentDate}</span>
          <span>Simulation speed: {isPaused ? 'Paused' : SPEED_PRESETS[speedPreset].displayMultiplier}</span>
        </div>
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={sliderValue}
          onPointerDown={() => togglePaused(true)}
          onChange={(event) => {
            const value = Number(event.target.value)
            setDisplayDays(value)
            setSimTimeDays(value)
          }}
          aria-label="Scrub simulated time"
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-electric-blue"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/5 p-1" role="group" aria-label="Simulation speed">
        {(Object.keys(SPEED_PRESETS) as SpeedPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={speedPreset === preset}
            onClick={() => setSpeedPreset(preset)}
            className={`rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
              speedPreset === preset ? 'bg-electric-blue text-space-black' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {SPEED_PRESETS[preset].label}
          </button>
        ))}
      </div>
    </div>
  )
}
