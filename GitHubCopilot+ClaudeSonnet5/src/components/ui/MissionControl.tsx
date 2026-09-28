import { useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { MISSIONS } from '../../data/missions'
import { RocketIcon } from './icons'

/** HUD shown during Spacecraft Mode: live telemetry, a destination picker, and controls legend. */
export function MissionControl() {
  const isSpacecraftMode = useSimulationStore((s) => s.isSpacecraftMode)
  const setSpacecraftMode = useSimulationStore((s) => s.setSpacecraftMode)
  const telemetry = useSimulationStore((s) => s.spacecraftTelemetry)
  const [missionId, setMissionId] = useState<string | null>(null)

  if (!isSpacecraftMode) return null

  const mission = MISSIONS.find((m) => m.id === missionId)

  return (
    <div className="pointer-events-auto glass-panel flex w-full flex-col gap-3 rounded-2xl p-4 sm:w-80">
      <div className="flex items-center gap-2">
        <RocketIcon className="h-5 w-5 text-electric-blue" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Mission Control</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/5 px-2 py-1.5">
          <p className="text-white/50">Speed</p>
          <p className="font-medium text-white">{telemetry.speed.toFixed(1)} units/s</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1.5">
          <p className="text-white/50">Distance from Sun</p>
          <p className="font-medium text-white">{telemetry.distanceFromSun.toFixed(1)} units</p>
        </div>
      </div>

      <p className="text-xs text-white/60">
        Destination: <span className="text-white/90">{mission ? mission.label : 'Free flight'}</span>
      </p>
      {mission && <p className="-mt-2 text-[11px] text-white/50">{mission.briefing}</p>}

      <div className="flex flex-wrap gap-1.5">
        {MISSIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMissionId(m.id)}
            aria-pressed={missionId === m.id}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              missionId === m.id ? 'bg-electric-blue text-space-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-white/50">
        Controls: <kbd className="rounded bg-white/10 px-1">W</kbd>/<kbd className="rounded bg-white/10 px-1">S</kbd> thrust,{' '}
        <kbd className="rounded bg-white/10 px-1">A</kbd>/<kbd className="rounded bg-white/10 px-1">D</kbd> turn,{' '}
        <kbd className="rounded bg-white/10 px-1">Q</kbd>/<kbd className="rounded bg-white/10 px-1">E</kbd> pitch.
      </p>

      <button
        type="button"
        onClick={() => setSpacecraftMode(false)}
        className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/20"
      >
        Exit Spacecraft Mode
      </button>
    </div>
  )
}
