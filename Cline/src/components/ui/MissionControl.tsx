import { useEffect, useState } from 'react'
import { Panel } from './Panel'
import { useSimulation } from '../../store/simulationStore'
import { PLANETS } from '../../data/planets'
import { getBodyInfo } from '../../data/bodies'
import { flyTo, spacecraftHud } from '../3d/Spacecraft'
import { flightKeys } from '../../hooks/useKeyboardControls'
import type { FlightKey } from '../../hooks/useKeyboardControls'
import { audio } from '../../audio/audioEngine'
import type { BodyId } from '../../types'

const DESTINATIONS: BodyId[] = ['moon', ...PLANETS.map((p) => p.id)]

interface HudData {
  speed: number
  distanceAU: number
  destination: BodyId | null
  autopilot: boolean
}

function HoldPad({ label, flightKey, ariaLabel }: { label: string; flightKey: FlightKey; ariaLabel: string }): JSX.Element {
  const set = (v: boolean) => (): void => {
    flightKeys[flightKey] = v
  }
  return (
    <button
      type="button"
      className="btn !px-0 text-lg"
      aria-label={ariaLabel}
      onPointerDown={set(true)}
      onPointerUp={set(false)}
      onPointerLeave={set(false)}
      onPointerCancel={set(false)}
    >
      {label}
    </button>
  )
}

/** Spacecraft launcher, HUD and touch controls. */
export function MissionControl(): JSX.Element {
  const open = useSimulation((s) => s.panel === 'missions')
  const setPanel = useSimulation((s) => s.setPanel)
  const focus = useSimulation((s) => s.focus)
  const focusSpacecraft = useSimulation((s) => s.focusSpacecraft)
  const focusSystem = useSimulation((s) => s.focusSystem)
  const pushToast = useSimulation((s) => s.pushToast)
  const flying = focus.mode === 'spacecraft'
  const [hud, setHud] = useState<HudData>({ speed: 0, distanceAU: 1, destination: null, autopilot: false })

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => setHud({ ...spacecraftHud }), 300)
    return () => window.clearInterval(id)
  }, [open])

  return (
    <Panel open={open} title="Mission Control" emoji="🚀" onClose={() => setPanel('none')}>
      <div className="space-y-4">
        <p className="text-sm leading-snug text-white/75">
          {flying
            ? 'You are flying! 🛸 Use the controls or the pads below. Try "Fly to" for autopilot.'
            : 'Pilot your own spacecraft around the Solar System and visit planets up close!'}
        </p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
            <p className="stat-label">Speed</p>
            <p className="stat-value">{hud.speed.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
            <p className="stat-label">From Sun</p>
            <p className="stat-value">{hud.distanceAU.toFixed(2)} AU</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
            <p className="stat-label">Destination</p>
            <p className="stat-value text-xs leading-tight">
              {hud.autopilot && hud.destination ? getBodyInfo(hud.destination).name : 'Manual'}
            </p>
          </div>
        </div>
        <p className="-mt-2 text-[11px] text-white/40">
          Distances use the educational scene scale.
        </p>

        {!flying ? (
          <button
            type="button"
            className="btn btn-primary w-full !py-3 text-base"
            onClick={() => {
              focusSpacecraft()
              audio.whoosh()
              pushToast('Launch! W/S thrust • A/D turn • ↑/↓ pitch • Shift = boost', '🚀')
            }}
          >
            🚀 Launch spacecraft
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {DESTINATIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`chip justify-center ${hud.autopilot && hud.destination === id ? 'chip-active' : ''}`}
                  onClick={() => {
                    flyTo(id)
                    audio.blip(900)
                  }}
                >
                  Fly to {getBodyInfo(id).name}
                </button>
              ))}
            </div>
            <button type="button" className="btn w-full" onClick={focusSystem}>
              🛬 Return to overview
            </button>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-[12px] leading-relaxed text-white/60">
              <p className="stat-label mb-1">Manual controls</p>
              <p>
                <kbd className="text-white/85">W</kbd>/<kbd className="text-white/85">S</kbd> thrust/brake •{' '}
                <kbd className="text-white/85">A</kbd>/<kbd className="text-white/85">D</kbd> turn •{' '}
                <kbd className="text-white/85">↑</kbd>/<kbd className="text-white/85">↓</kbd> pitch •{' '}
                <kbd className="text-white/85">Q</kbd>/<kbd className="text-white/85">E</kbd> roll •{' '}
                <kbd className="text-white/85">Shift</kbd> boost
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <HoldPad label="▲" flightKey="forward" ariaLabel="Thrust forward" />
              <HoldPad label="◀" flightKey="yawLeft" ariaLabel="Turn left" />
              <HoldPad label="▶" flightKey="yawRight" ariaLabel="Turn right" />
              <HoldPad label="▼" flightKey="back" ariaLabel="Brake" />
              <HoldPad label="⤒" flightKey="pitchUp" ariaLabel="Pitch up" />
              <HoldPad label="⤓" flightKey="pitchDown" ariaLabel="Pitch down" />
            </div>
          </>
        )}
      </div>
    </Panel>
  )
}
