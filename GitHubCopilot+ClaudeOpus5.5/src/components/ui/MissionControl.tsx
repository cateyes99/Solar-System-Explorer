import { AnimatePresence, motion } from 'framer-motion'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { DESTINATIONS, MISSIONS } from '../../data/missions'
import { BODIES, isPlanetId } from '../../data/planets'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { flightInput } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { SPEED_OF_LIGHT_KM_S } from '../../utils/astronomy'
import { formatNumber } from '../../utils/format'
import { Icon, type IconName } from './Icon'
import { PlanetOrb } from './PlanetOrb'

type FlightKey = keyof typeof flightInput

function formatSpeed(kmS: number): string {
  if (kmS >= 1e9) return `${formatNumber(kmS / 1e9, 1)} billion km/s`
  if (kmS >= 1e6) return `${formatNumber(kmS / 1e6, 1)} million km/s`
  return `${formatNumber(kmS, 0)} km/s`
}

function holdHandlers(key: FlightKey) {
  const set = (value: boolean) => (e: ReactPointerEvent) => {
    e.preventDefault()
    flightInput[key] = value
  }
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      set(true)(e)
    },
    onPointerUp: set(false),
    onPointerCancel: set(false),
    onLostPointerCapture: () => {
      flightInput[key] = false
    },
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
  }
}

function PadButton({ k, icon, label, className = '' }: { k: FlightKey; icon: IconName; label: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`btn glass-soft h-14 w-14 touch-none rounded-2xl p-0 select-none ${className}`}
      {...holdHandlers(k)}
    >
      <Icon name={icon} size={24} />
    </button>
  )
}

function FlightPad() {
  return (
    <div className="pointer-events-auto fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-end gap-3 lg:left-4 lg:right-auto">
      <div className="grid grid-cols-3 grid-rows-2 gap-2" role="group" aria-label="Steering">
        <span />
        <PadButton k="up" icon="chevronUp" label="Nose up" />
        <span />
        <PadButton k="left" icon="chevronLeft" label="Turn left" />
        <PadButton k="down" icon="chevronDown" label="Nose down" />
        <PadButton k="right" icon="chevronRight" label="Turn right" />
      </div>
      <div className="flex flex-col gap-2" role="group" aria-label="Engines">
        <button type="button" aria-label="Boost" className="btn glass-soft h-14 w-16 touch-none rounded-2xl p-0 text-amber-200 select-none" {...holdHandlers('boost')}>
          <Icon name="boost" size={22} />
        </button>
        <div className="flex gap-2">
          <button type="button" aria-label="Brake" className="btn glass-soft h-14 w-16 touch-none rounded-2xl p-0 select-none" {...holdHandlers('back')}>
            Brake
          </button>
          <button type="button" aria-label="Thrust" className="btn-primary h-14 w-20 touch-none rounded-2xl p-0 select-none" {...holdHandlers('forward')}>
            <Icon name="rocket" size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Readout({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] px-3 py-2">
      <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</div>
      <div className="font-display text-lg font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="text-[11px] leading-snug text-slate-400">{sub}</div>}
    </div>
  )
}

export function MissionControl() {
  const active = useSimulationStore((s) => s.appMode === 'mission')
  const telemetry = useSimulationStore((s) => s.telemetry)
  const destinationId = useSimulationStore((s) => s.destinationId)
  const autopilot = useSimulationStore((s) => s.autopilot)
  const visited = useSimulationStore((s) => s.visited)
  const completed = useSimulationStore((s) => s.completedMissions)
  const setDestination = useSimulationStore((s) => s.setDestination)
  const setAutopilot = useSimulationStore((s) => s.setAutopilot)
  const setAppMode = useSimulationStore((s) => s.setAppMode)
  const isDesktop = useIsDesktop()

  const lightFraction = telemetry.speedKmS / SPEED_OF_LIGHT_KM_S
  const speedSub =
    lightFraction >= 1
      ? `${formatNumber(lightFraction, lightFraction < 10 ? 1 : 0)}× faster than light – only possible in a game! Real spacecraft fly about 10–20 km/s.`
      : lightFraction > 0.01
        ? `${formatNumber(lightFraction * 100, 0)}% of the speed of light – far faster than any real rocket`
        : 'Real spacecraft fly about 10–20 km/s'
  const destination = BODIES[destinationId]

  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.section
            key="mission-panel"
            aria-label="Mission Control"
            initial={{ opacity: 0, y: isDesktop ? 0 : -20, x: isDesktop ? 30 : 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0 }}
            className={
              isDesktop
                ? 'glass scroll-thin pointer-events-auto fixed top-[5.25rem] right-4 bottom-4 z-30 w-[380px] overflow-y-auto rounded-3xl p-5'
                : 'glass no-scrollbar pointer-events-auto fixed inset-x-3 top-[4.75rem] z-30 max-h-[38vh] overflow-y-auto rounded-3xl p-4'
            }
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-300 text-slate-900">
                <Icon name="rocket" />
              </span>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold text-white">Mission Control</h2>
                <p className="text-xs text-slate-400">Fly with the pad or W A S D + arrow keys</p>
              </div>
              <button type="button" className="btn" onClick={() => setAppMode('explore')}>
                Exit
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              <Readout label="Speed" value={formatSpeed(telemetry.speedKmS)} sub={speedSub} />
              <Readout
                label="Distance from Sun"
                value={`${formatNumber(telemetry.distanceAU, 2)} AU`}
                sub={`${formatNumber((telemetry.distanceAU * 149.6), 0)} million km`}
              />
              <Readout label="Destination" value={destination.name.replace(/^The /, '')} sub={autopilot === 'fly' ? 'Autopilot engaged' : autopilot === 'orbit' ? 'Riding the orbit' : 'Manual flight'} />
              <Readout label="Nearest" value={telemetry.nearestId ? BODIES[telemetry.nearestId].name.replace(/^The /, '') : '—'} />
            </div>

            <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-400 uppercase">Choose a destination</h3>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Destination">
              {DESTINATIONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={destinationId === id}
                  className={`btn min-h-10 gap-1.5 px-2.5 text-xs ${destinationId === id ? 'btn-active' : ''}`}
                  onClick={() => setDestination(id)}
                >
                  <PlanetOrb id={id} size={16} />
                  {BODIES[id].name.replace(/^The /, '')}
                  {visited.includes(id) && <Icon name="check" size={14} className="text-emerald-300" />}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" aria-pressed={autopilot === 'fly'} onClick={() => setAutopilot(autopilot === 'fly' ? 'off' : 'fly')}>
                <Icon name="target" size={18} /> {autopilot === 'fly' ? 'Cancel autopilot' : `Fly to ${destination.name.replace(/^The /, '')}`}
              </button>
              <button type="button" className="btn" aria-pressed={autopilot === 'orbit'} onClick={() => setAutopilot(autopilot === 'orbit' ? 'off' : 'orbit')}>
                <Icon name="orbit" size={18} /> {isPlanetId(destinationId) ? 'Ride its orbit' : 'Circle it'}
              </button>
            </div>

            <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-400 uppercase">Missions</h3>
            <ul className="mt-2 space-y-2">
              {MISSIONS.map((mission) => {
                const done = completed.includes(mission.id)
                const count = mission.targets.filter((t) => visited.includes(t)).length
                return (
                  <li key={mission.id} className={`rounded-2xl border p-3 ${done ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/8 bg-white/[0.03]'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{mission.title}</span>
                      <span className="ml-auto text-xs font-semibold text-slate-400 tabular-nums">
                        {done ? 'Complete!' : `${count}/${mission.targets.length}`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-400">{mission.description}</p>
                  </li>
                )
              })}
            </ul>
          </motion.section>
          <FlightPad key="flight-pad" />
        </>
      )}
    </AnimatePresence>
  )
}
