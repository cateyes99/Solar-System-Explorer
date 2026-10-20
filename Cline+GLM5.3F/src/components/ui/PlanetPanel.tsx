import { Panel } from './Panel'
import { useSimulation } from '../../store/simulationStore'
import { getBodyInfo } from '../../data/bodies'
import { formatKm, formatNumber, formatPeriod, formatRotation, formatTemperature } from '../../utils/astronomy'

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  )
}

/** Beautiful information panel for the selected body (planet, Sun or Moon). */
export function PlanetPanel(): JSX.Element {
  const selected = useSimulation((s) => s.selectedBody)
  const focus = useSimulation((s) => s.focus)
  const focusBody = useSimulation((s) => s.focusBody)
  const focusSystem = useSimulation((s) => s.focusSystem)
  const info = selected ? getBodyInfo(selected) : null

  return (
    <Panel
      open={Boolean(info)}
      title={info?.name ?? ''}
      emoji="🪐"
      side="right"
      onClose={() => useSimulation.getState().selectBody(null)}
    >
      {info && (
        <div className="space-y-4">
          <span
            className="chip"
            style={{ borderColor: `${info.accentColor}55`, color: info.accentColor }}
          >
            {info.type}
          </span>
          <p className="text-sm leading-relaxed text-white/80">{info.description}</p>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Diameter" value={`${formatNumber(info.diameterKm)} km`} />
            <Stat
              label={info.id === 'moon' ? 'Distance from Earth' : 'Distance from Sun'}
              value={
                info.id === 'moon' && info.distanceFromParentKm
                  ? formatKm(info.distanceFromParentKm)
                  : info.distanceFromSunKm
                    ? formatKm(info.distanceFromSunKm)
                    : '—'
              }
            />
            <Stat
              label="Length of year"
              value={info.orbitalPeriodDays > 0 ? formatPeriod(info.orbitalPeriodDays) : '—'}
            />
            <Stat
              label="Length of day"
              value={info.orbitalPeriodDays > 0 ? formatRotation(info.rotationPeriodHours) : '—'}
            />
            {info.moons !== null && <Stat label="Known moons" value={String(info.moons)} />}
            <Stat label="Temperature" value={formatTemperature(info.temperatureC)} />
          </div>

          <div>
            <h3 className="panel-title mb-2">Fun facts</h3>
            <ul className="space-y-1.5">
              {info.facts.map((f) => (
                <li key={f} className="flex gap-2 text-sm leading-snug text-white/75">
                  <span aria-hidden className="mt-0.5 text-astro-orange">
                    ★
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-astro-purple/30 bg-astro-purple/10 p-3">
            <p className="stat-label !text-astro-purple">Did you know?</p>
            <p className="mt-1 text-sm leading-snug text-white/85">{info.didYouKnow}</p>
          </div>

          <p className="text-[11px] text-white/40">
            Data is real but rounded. The 3D view is an educational model — not to scale!
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={() => focusBody(info.id, { follow: false })}
            >
              🔭 View
            </button>
            <button
              type="button"
              className="btn flex-1"
              onClick={() => focusBody(info.id, { follow: focus.mode !== 'follow' })}
            >
              {focus.mode === 'follow' ? '📌 Unfollow' : '📌 Follow'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={focusSystem}
              aria-label="Back to the whole Solar System"
            >
              🌌
            </button>
          </div>
        </div>
      )}
    </Panel>
  )
}
