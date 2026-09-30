import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimStore } from '../../store/simulationStore'
import { PLANETS } from '../../data/planets'
import { pressedKeys } from '../../utils/input'
import { sendCraftCommand, telemetry } from '../../utils/telemetry'
import { CloseIcon, RocketIcon } from './icons'
import { playBlip, playWhoosh } from '../../utils/audio'

interface TelemetryView {
  speed: number
  distanceAu: number
  destination: string
  arrived: boolean
}

/** Momentary on-screen key press (for touch). */
function HoldButton({
  code,
  label,
  className = '',
}: {
  code: string
  label: string
  className?: string
}) {
  const press = () => {
    pressedKeys.add(code)
    playBlip(420, 0.05, 0.03)
  }
  const release = () => pressedKeys.delete(code)

  return (
    <button
      type="button"
      className={`chip !min-h-11 !min-w-11 select-none items-center justify-center !px-3 !py-2 ${className}`}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      aria-label={label}
    >
      {label}
    </button>
  )
}

/**
 * Mission Control: flight HUD, destinations, autopilot and touch controls.
 */
export function MissionControl() {
  const active = useSimStore((s) => s.spacecraftActive)
  const setSpacecraftActive = useSimStore((s) => s.setSpacecraftActive)
  const [view, setView] = useState<TelemetryView>({
    speed: 0,
    distanceAu: 0,
    destination: 'Free flight',
    arrived: false,
  })

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      setView({
        speed: telemetry.speed,
        distanceAu: telemetry.distanceAu,
        destination: telemetry.destinationLabel,
        arrived: telemetry.arrived,
      })
    }, 140)
    return () => window.clearInterval(id)
  }, [active])

  const flyTo = (id: string) => {
    playWhoosh(0.05)
    sendCraftCommand({ kind: 'body', id })
  }
  const rideOrbit = (id: string) => {
    playWhoosh(0.05)
    sendCraftCommand({ kind: 'orbit', id })
  }
  const stop = () => {
    playBlip(320, 0.08)
    sendCraftCommand({ kind: 'stop' })
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-3 sm:pb-3 md:inset-x-auto md:left-3 md:bottom-3 md:w-[24rem]"
          role="region"
          aria-label="Mission Control"
        >
          <div className="panel rounded-3xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="hud-title flex items-center gap-2 text-[11px] text-cyan-300">
                <RocketIcon width={14} height={14} /> Mission Control
              </span>
              <button
                type="button"
                className="chip !px-2 !py-1"
                onClick={() => {
                  playBlip(300, 0.09)
                  setSpacecraftActive(false)
                }}
                aria-label="Leave the spacecraft"
              >
                <CloseIcon width={14} height={14} /> Exit
              </button>
            </div>

            {/* HUD readouts */}
            <dl className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-cyan-300/70">Speed</dt>
                <dd className="font-display text-sm font-semibold text-white tabular-nums">
                  {view.speed.toFixed(1)}
                </dd>
                <dd className="text-[9px] text-white/45">units / second</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-cyan-300/70">
                  From Sun
                </dt>
                <dd className="font-display text-sm font-semibold text-white tabular-nums">
                  {view.distanceAu.toFixed(2)}
                </dd>
                <dd className="text-[9px] text-white/45">AU (approx.)</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-cyan-300/70">
                  Destination
                </dt>
                <dd className="truncate font-display text-sm font-semibold text-solar-200">
                  {view.destination}
                </dd>
                <dd className="text-[9px] text-white/45">
                  {view.arrived ? 'arrived!' : 'en route'}
                </dd>
              </div>
            </dl>

            {/* Destinations */}
            <div className="mb-2">
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/50">
                Fly to a world
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="chip !text-[11px]" onClick={() => flyTo('sun')}>
                  The Sun
                </button>
                {PLANETS.map((planet) => (
                  <button
                    key={planet.id}
                    type="button"
                    className="chip !text-[11px]"
                    onClick={() => flyTo(planet.id)}
                  >
                    {planet.name}
                  </button>
                ))}
                <button type="button" className="chip !text-[11px]" onClick={stop}>
                  Stop
                </button>
              </div>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/50">
                Ride an orbit
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PLANETS.map((planet) => (
                  <button
                    key={planet.id}
                    type="button"
                    className="chip chip-solar !text-[11px]"
                    onClick={() => rideOrbit(planet.id)}
                  >
                    {planet.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Touch flight controls */}
            <div className="flex items-end justify-between gap-3">
              <div className="grid grid-cols-3 gap-1.5" aria-label="Flight controls">
                <span />
                <HoldButton code="ArrowUp" label="Pitch ▲" />
                <span />
                <HoldButton code="KeyA" label="◀ Turn" />
                <HoldButton code="KeyW" label="Thrust" />
                <HoldButton code="KeyD" label="Turn ▶" />
                <HoldButton code="KeyR" label="Down" />
                <HoldButton code="ArrowDown" label="Pitch ▼" />
                <HoldButton code="KeyF" label="Up" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <HoldButton code="ShiftLeft" label="BOOST" className="!border-solar-400/60 !text-solar-200" />
                <HoldButton code="KeyS" label="Brake / reverse" />
              </div>
            </div>

            <p className="mt-2 text-[11px] leading-snug text-white/50">
              Keyboard: <kbd className="rounded bg-white/10 px-1">W</kbd> thrust ·{' '}
              <kbd className="rounded bg-white/10 px-1">A/D</kbd> turn ·{' '}
              <kbd className="rounded bg-white/10 px-1">R/F</kbd> up/down ·{' '}
              <kbd className="rounded bg-white/10 px-1">↑/↓</kbd> pitch ·{' '}
              <kbd className="rounded bg-white/10 px-1">Shift</kbd> boost
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
