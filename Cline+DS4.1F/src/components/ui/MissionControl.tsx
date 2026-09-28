import { AnimatePresence } from 'framer-motion'
import { TRAVEL_DESTINATIONS } from '../../data/missions'
import { useSimulationStore } from '../../store/simulationStore'
import { useMissionReadout } from '../../hooks/useMissionReadout'
import { formatKm } from '../../utils/format'
import { kmPerUnit } from '../../utils/scale'
import { Chip, SectionTitle, Sheet, Stat, ToggleRow, ToolbarButton } from './primitives'
import { RocketIcon } from './icons'

/**
 * Mission Control.
 *
 * Choose a destination and the autopilot flies the ship there; or switch the
 * autopilot off and fly it by hand with W/A/S/D, R to climb, F to dive and
 * Shift to boost. Live telemetry comes from the flight model at 5 Hz.
 */
export function MissionControl() {
  const missionActive = useSimulationStore((state) => state.missionActive)
  const endMission = useSimulationStore((state) => state.endMission)
  const destinationId = useSimulationStore((state) => state.destinationId)
  const setDestination = useSimulationStore((state) => state.setDestination)
  const autopilot = useSimulationStore((state) => state.autopilot)
  const setAutopilot = useSimulationStore((state) => state.setAutopilot)
  const showToast = useSimulationStore((state) => state.showToast)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const readout = useMissionReadout()

  const destination = TRAVEL_DESTINATIONS.find((entry) => entry.id === destinationId)
  const statusLabel =
    readout.status === 'arrived' ? 'Arrived — look around!' : readout.status === 'cruising' ? 'Cruising' : 'Idle'
  const kilometresPerUnit = kmPerUnit(scaleMode, customScale)

  return (
    <AnimatePresence>
      {missionActive ? (
        <Sheet position="bottom" label="Mission Control">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-ice">
              <RocketIcon size={20} />
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Mission Control</h2>
            </div>
            <Chip tone={readout.status === 'arrived' ? 'ice' : 'neutral'}>{statusLabel}</Chip>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat
              label="Speed"
              value={`${readout.speed.toFixed(2)} units/s`}
              hint={`${Math.round(readout.speedKmPerSecond).toLocaleString('en-US')} km/s (simulated)`}
            />
            <Stat
              label="Distance from Sun"
              value={formatKm(readout.distanceFromSun * kilometresPerUnit)}
              hint="measured in the current scale"
            />
            <Stat
              label="Destination"
              value={destination ? destination.name : '—'}
              hint={
                readout.distanceToDestinationKm > 0
                  ? `${formatKm(readout.distanceToDestinationKm)} to go`
                  : 'arrived'
              }
            />
            <Stat
              label="Pilot"
              value={autopilot ? 'Autopilot' : 'You'}
              hint={autopilot ? 'hands off' : 'use the keys below'}
            />
          </div>

          <div className="mt-3">
            <SectionTitle hint="tap to set course">Choose a destination</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {TRAVEL_DESTINATIONS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={destinationId === entry.id}
                  onClick={() => {
                    setDestination(entry.id)
                    setAutopilot(true)
                    showToast(`Course set for ${entry.name}. ${entry.funFact}`, 'info')
                  }}
                  className={`min-h-[2.5rem] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    destinationId === entry.id
                      ? 'border-ice/60 bg-ice/20 text-parchment'
                      : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
                  }`}
                >
                  {entry.name}
                </button>
              ))}
            </div>
            {destination ? (
              <p className="mt-2 text-xs leading-relaxed text-mist/90">
                {destination.description}
                {destination.lightMinutesFromEarth > 0
                  ? ` Radio messages from Earth would take about ${destination.lightMinutesFromEarth} minutes to arrive.`
                  : ''}
              </p>
            ) : null}
          </div>

          <div className="mt-2">
            <ToggleRow
              label="Autopilot"
              description="Fly to the destination automatically"
              checked={autopilot}
              onChange={() => setAutopilot(!autopilot)}
            />
          </div>

          <p className="mt-2 text-[0.68rem] leading-relaxed text-mist/80">
            Manual flight: <strong className="text-parchment">W/A/S/D</strong> move relative to the camera,{' '}
            <strong className="text-parchment">R</strong> climbs, <strong className="text-parchment">F</strong> dives and{' '}
            <strong className="text-parchment">Shift</strong> boosts. Turn the autopilot off to take the controls. Speeds
            and distances are converted from scene units, so they show the scale of the journey rather than a real
            spacecraft trajectory.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <ToolbarButton
              compact
              variant="ghost"
              onClick={() => {
                setDestination('earth')
                setAutopilot(true)
              }}
            >
              Head home to Earth
            </ToolbarButton>
            <ToolbarButton compact variant="danger" onClick={endMission}>
              End mission
            </ToolbarButton>
          </div>
        </Sheet>
      ) : null}
    </AnimatePresence>
  )
}