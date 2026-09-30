import { AnimatePresence, motion } from 'framer-motion'
import { MISSIONS } from '../../data/missions'
import { useAppStore } from '../../store/useAppStore'
import { Panel } from './primitives/Panel'
import { Button } from './primitives/Button'
import { Icon } from './Icon'
import { spaceAudio } from '../../utils/audio'
import { resolveBodyName } from '../../utils/astronomy'

const THRUST_KEYS: { keys: string; label: string }[] = [
  { keys: 'W / S', label: 'Forward and back' },
  { keys: 'A / D', label: 'Turn left and right' },
  { keys: 'Q / E', label: 'Down and up' },
  { keys: 'Shift', label: 'Boost' },
]

export function MissionControl() {
  const panel = useAppStore((s) => s.panel)
  const shipActive = useAppStore((s) => s.shipActive)
  const setShipActive = useAppStore((s) => s.setShipActive)
  const shipTarget = useAppStore((s) => s.shipTarget)
  const setShipTarget = useAppStore((s) => s.setShipTarget)
  const autopilot = useAppStore((s) => s.shipAutopilot)
  const setShipAutopilot = useAppStore((s) => s.setShipAutopilot)
  const telemetry = useAppStore((s) => s.shipTelemetry)
  const setPanel = useAppStore((s) => s.setPanel)

  const mission = shipTarget ? MISSIONS.find((m) => m.id === shipTarget) : null

  return (
    <AnimatePresence>
      {panel === 'missions' && (
        <Panel
          title="Mission Control"
          eyebrow={shipActive ? 'Probe online' : 'Standby'}
          onClose={() => setPanel(null)}
        >
          <div className="space-y-5">
            {!shipActive ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-edge bg-white/3 p-4">
                  <div className="flex items-start gap-3">
                    <Icon name="rocket" size={20} className="mt-0.5 shrink-0 text-cyan-glow" />
                    <div>
                      <p className="text-[13.5px] font-semibold text-ice-50">Deploy your probe</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-ice-200/75">
                        Take the controls yourself, or pick a destination and let the probe fly itself. Either way,
                        the whole Solar System is yours to visit.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  icon="rocket"
                  variant="solid"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setShipActive(true)
                    spaceAudio.play('launch')
                  }}
                >
                  Launch the probe
                </Button>
              </div>
            ) : (
              <>
                {/* Telemetry */}
                <div className="rounded-xl border border-edge bg-black/30 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow">Live telemetry</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-cyan-200 uppercase">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-glow" />
                      Linked
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <Readout
                      label="Speed"
                      value={`${telemetry.speedUnitsPerSecond.toFixed(1)} u/s`}
                    />
                    <Readout label="Distance from the Sun" value={`${telemetry.distanceAu.toFixed(2)} AU`} />
                    <Readout label="Destination" value={telemetry.targetName} />
                    <Readout
                      label="Status"
                      value={telemetry.arrived ? 'Arrived' : autopilot ? 'Under way' : 'Manual control'}
                      tone={telemetry.arrived ? 'cyan' : 'plain'}
                    />
                  </dl>

                  {autopilot && !telemetry.arrived && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] tracking-wider text-ice-400 uppercase">
                        <span>Approach</span>
                        <span className="font-mono tabular-nums">{Math.round(telemetry.arrivalProgress * 100)}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-cyan-glow transition-[width] duration-300"
                          style={{ width: `${Math.max(3, telemetry.arrivalProgress * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <p className="eyebrow mb-2">Destination</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {MISSIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setShipTarget(m.id)
                          spaceAudio.play('click')
                        }}
                        aria-pressed={shipTarget === m.id}
                        className={[
                          'rounded-lg border px-2.5 py-2 text-left text-[11.5px] font-medium transition-colors',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                          shipTarget === m.id
                            ? 'border-cyan-glow/45 bg-cyan-glow/12 text-cyan-100'
                            : 'border-edge text-ice-200/80 hover:border-edge-strong hover:text-ice-50',
                        ].join(' ')}
                      >
                        {resolveBodyName(m.id)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    icon="target"
                    active={autopilot}
                    onClick={() => setShipAutopilot(!autopilot)}
                  >
                    {autopilot ? 'Autopilot on' : 'Hand-fly'}
                  </Button>
                  <Button
                    icon="target"
                    onClick={() => {
                      useAppStore.getState().focus(shipTarget ?? 'earth', 'follow')
                      setPanel(null)
                    }}
                  >
                    Chase the probe
                  </Button>
                </div>

                <div className="rounded-xl border border-edge bg-white/3 p-3.5">
                  <p className="eyebrow mb-2">Keyboard</p>
                  <ul className="space-y-1.5">
                    {THRUST_KEYS.map((row) => (
                      <li key={row.keys} className="flex items-center gap-3 text-[12px]">
                        <kbd className="min-w-[4.5rem] rounded border border-edge bg-black/30 px-1.5 py-0.5 text-center font-mono text-[10.5px] text-ice-200">
                          {row.keys}
                        </kbd>
                        <span className="text-ice-200/75">{row.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-[11px] text-ice-400/65">
                    Using the keyboard hands control back to you automatically.
                  </p>
                </div>

                {mission && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mission.id + (telemetry.arrived ? '-arrived' : '-cruise')}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-xl border border-cyan-glow/25 bg-cyan-glow/8 p-4"
                    >
                      <p className="text-[12.5px] font-semibold text-cyan-100">
                        {telemetry.arrived ? `Welcome to ${resolveBodyName(mission.id)}` : 'Cruise notes'}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ice-100/85">
                        {telemetry.arrived ? mission.cruisingFact : mission.brief}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}

                <Button
                  icon="close"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShipActive(false)
                    spaceAudio.play('click')
                  }}
                >
                  Recall the probe
                </Button>
              </>
            )}
          </div>
        </Panel>
      )}
    </AnimatePresence>
  )
}

function Readout({ label, value, tone = 'plain' }: { label: string; value: string; tone?: 'plain' | 'cyan' }) {
  return (
    <div>
      <dt className="text-[10px] font-medium tracking-wider text-ice-400/70 uppercase">{label}</dt>
      <dd
        className={`mt-0.5 truncate font-mono text-[13px] tabular-nums ${
          tone === 'cyan' ? 'text-cyan-200' : 'text-ice-50'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}