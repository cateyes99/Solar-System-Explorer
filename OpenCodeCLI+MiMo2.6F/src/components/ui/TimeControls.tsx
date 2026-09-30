import { useSimStore, SPEED_OPTIONS, type SpeedPreset } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { formatSimDate, daysSinceJ2000 } from '../../utils/astronomy'
import { jumpSimDays, simDateMs } from '../../utils/simClock'
import { FastIcon, PauseIcon, PlayIcon } from './icons'
import { playBlip } from '../../utils/audio'
import type { ScaleMode } from '../../utils/scale'

const SCALE_OPTIONS: { id: ScaleMode; label: string }[] = [
  { id: 'educational', label: 'Educational Scale' },
  { id: 'relativeSize', label: 'Relative Size' },
  { id: 'distances', label: 'Distances Emphasized' },
  { id: 'custom', label: 'Custom' },
]

/**
 * Bottom timeline: playback, speed presets, simulated date and scale mode.
 */
export function TimeControls() {
  const paused = useSimStore((s) => s.paused)
  const speedPreset = useSimStore((s) => s.speedPreset)
  const speedLabel = useSimStore((s) => s.speedLabel)
  const simDate = useSimStore((s) => s.simDateMs)
  const setSpeed = useSimStore((s) => s.setSpeed)
  const togglePause = useSimStore((s) => s.togglePause)
  const scaleMode = useSimStore((s) => s.scaleMode)
  const setScaleMode = useSimStore((s) => s.setScaleMode)
  const setCustomScale = useSimStore((s) => s.setCustomScale)
  const customScale = useSimStore((s) => s.customScale)
  const tourActive = useSimStore((s) => s.tour.active)
  const scale = useScale()

  const playing = !paused
  const dateLabel = formatSimDate(daysSinceJ2000(simDate))

  const handleSpeed = (preset: SpeedPreset) => {
    playBlip(600, 0.06)
    setSpeed(preset)
  }

  const stepTime = (days: number) => {
    jumpSimDays(days)
    useSimStore.getState().setSimDate(simDateMs())
    playBlip(480, 0.06)
  }

  return (
    <div
      className={[
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-3 sm:pb-3',
        tourActive ? 'opacity-0 transition-opacity duration-300' : 'transition-opacity duration-300',
      ].join(' ')}
      aria-hidden={tourActive}
    >
      <div className="panel pointer-events-auto mx-auto max-w-5xl rounded-2xl px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {/* Play / pause */}
          <button
            type="button"
            onClick={() => {
              playBlip(playing ? 380 : 720, 0.08)
              togglePause()
            }}
            className="chip !px-3"
            aria-label={playing ? 'Pause simulation' : 'Play simulation'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
            <span className="hidden sm:inline">{playing ? 'Pause' : 'Play'}</span>
          </button>

          <span className="hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

          {/* Speed presets */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Simulation speed">
            {SPEED_OPTIONS.filter((option) => option.id !== 'paused').map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSpeed(option.id)}
                data-active={speedPreset === option.id ? 'true' : 'false'}
                className="chip"
                aria-pressed={speedPreset === option.id}
              >
                {option.id === 'veryFast' && <FastIcon width={14} height={14} />}
                {option.label}
              </button>
            ))}
          </div>

          <span className="hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

          {/* Time stepping */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Advance time">
            <button type="button" className="chip" onClick={() => stepTime(1)}>
              +1 day
            </button>
            <button type="button" className="chip" onClick={() => stepTime(30)}>
              +30 days
            </button>
            <button type="button" className="chip" onClick={() => stepTime(365.25)}>
              +1 year
            </button>
          </div>

          {/* Date + speed readout */}
          <div className="ml-auto flex items-center gap-3 text-right">
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/70">
                Simulated date
              </div>
              <div className="font-display text-sm font-semibold text-white tabular-nums">
                {dateLabel}
              </div>
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.18em] text-solar-400/80">
                Speed
              </div>
              <div className="font-display text-sm font-semibold text-solar-200">{speedLabel}</div>
            </div>
          </div>
        </div>

        {/* Scale mode row */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 border-t border-white/10 pt-2">
          <span className="mr-1 hidden text-[10px] uppercase tracking-[0.2em] text-white/50 sm:inline">
            Scale
          </span>
          {SCALE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                playBlip(540, 0.06)
                setScaleMode(option.id)
                if (option.id === 'custom') {
                  setCustomScale({ sizeScale: 1.4, distancePower: 0.75 })
                }
              }}
              data-active={scaleMode === option.id ? 'true' : 'false'}
              className="chip chip-solar !py-1 !text-[11px]"
              aria-pressed={scaleMode === option.id}
            >
              {option.label}
            </button>
          ))}

          {scaleMode === 'custom' && (
            <div className="flex w-full flex-wrap items-center justify-center gap-3 pt-1 sm:w-auto">
              <label className="flex items-center gap-2 text-[11px] text-white/70">
                Planet size
                <input
                  type="range"
                  min={0.4}
                  max={3}
                  step={0.1}
                  value={customScale.sizeScale}
                  onChange={(event) =>
                    setCustomScale({ ...customScale, sizeScale: Number(event.target.value) })
                  }
                  className="w-28"
                  aria-label="Custom planet size multiplier"
                />
                <span className="w-8 tabular-nums text-cyan-300">
                  {customScale.sizeScale.toFixed(1)}×
                </span>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-white/70">
                Orbit spread
                <input
                  type="range"
                  min={0.4}
                  max={1.2}
                  step={0.05}
                  value={customScale.distancePower}
                  onChange={(event) =>
                    setCustomScale({ ...customScale, distancePower: Number(event.target.value) })
                  }
                  className="w-28"
                  aria-label="Custom orbital spacing"
                />
                <span className="w-8 tabular-nums text-cyan-300">
                  {customScale.distancePower.toFixed(2)}
                </span>
              </label>
            </div>
          )}
        </div>

        <p className="mt-1.5 text-center text-[11px] leading-snug text-amber-200/80">
          ⚠ {scale.note}
        </p>
      </div>
    </div>
  )
}
