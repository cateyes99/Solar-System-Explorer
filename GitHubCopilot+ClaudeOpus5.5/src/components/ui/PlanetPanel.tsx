import { motion } from 'framer-motion'
import { BODIES, EARTH_DIAMETER_KM } from '../../data/planets'
import type { BodyId } from '../../data/types'
import { usePlanetFocus } from '../../hooks/usePlanetFocus'
import { useSimulationStore } from '../../store/simulationStore'
import { lightTravelSeconds } from '../../utils/astronomy'
import { formatDays, formatDuration, formatHours, formatKm, formatNumber, formatTemperature } from '../../utils/format'
import { Icon } from './Icon'
import { Panel } from './Panel'
import { PlanetOrb } from './PlanetOrb'

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
      <dt className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-[15px] leading-snug font-semibold text-white">{value}</dd>
      {note && <dd className="mt-1 text-xs leading-snug text-slate-400">{note}</dd>}
    </div>
  )
}

function sizeComparison(id: BodyId): string | undefined {
  if (id === 'earth') return 'Our home planet'
  const ratio = BODIES[id].diameterKm / EARTH_DIAMETER_KM
  if (ratio > 1.05) return `About ${formatNumber(ratio, ratio < 10 ? 1 : 0)}× as wide as Earth`
  return `About ${formatNumber(ratio * 100, 0)}% as wide as Earth`
}

function PlanetDetails({ id }: { id: BodyId }) {
  const body = BODIES[id]
  const { focus, follow, isActive } = usePlanetFocus()
  const openLesson = useSimulationStore((s) => s.openLesson)
  const appMode = useSimulationStore((s) => s.appMode)
  const lightTime = id === 'sun' ? null : lightTravelSeconds(body.distanceFromSunKm)

  return (
    <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-4">
        <PlanetOrb id={id} size={64} />
        <div className="min-w-0">
          <div className="chip bg-white/8 text-cyan-200">{body.type}</div>
          <p className="mt-2 text-sm leading-snug text-slate-300">{body.tagline}</p>
        </div>
      </div>

      {appMode !== 'tour' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => focus(id)} aria-pressed={isActive('planet', id)}>
            <Icon name="target" size={18} /> {isActive('planet', id) ? 'Viewing' : 'Fly there'}
          </button>
          {id !== 'sun' && (
            <button type="button" className="btn" onClick={() => follow(id)} aria-pressed={isActive('follow', id)}>
              <Icon name="follow" size={18} /> Follow
            </button>
          )}
          <button type="button" className="btn" onClick={() => openLesson('sizes')}>
            <Icon name="orbit" size={18} /> Compare sizes
          </button>
        </div>
      )}

      <p className="mt-4 text-[15px] leading-relaxed text-slate-200">{body.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Diameter" value={`${formatNumber(body.diameterKm)} km`} note={sizeComparison(id)} />
        {body.parentId ? (
          <Stat label="Distance from Earth" value={formatKm(body.distanceFromParentKm ?? 0)} note="On average" />
        ) : id === 'sun' ? (
          <Stat label="Distance from Earth" value={formatKm(149_600_000)} note="Its light takes about 8 minutes 20 seconds to reach us" />
        ) : (
          <Stat
            label="Distance from Sun"
            value={formatKm(body.distanceFromSunKm)}
            note={lightTime ? `Sunlight takes ${formatDuration(lightTime)} to get here` : undefined}
          />
        )}
        <Stat
          label={id === 'sun' ? 'Trip around the galaxy' : id === 'moon' ? 'Trip around Earth' : 'Length of year'}
          value={id === 'sun' ? '≈ 230 million years' : formatDays(body.orbitalPeriodDays)}
          note={id === 'sun' ? undefined : body.orbitNote}
        />
        <Stat label="Length of day" value={formatHours(body.rotationPeriodHours)} note={body.dayNote} />
        <Stat label="Moons" value={formatNumber(body.moons)} note={body.moonsNote} />
        <Stat label="Temperature" value={formatTemperature(body.temperatureC)} note={body.temperatureNote} />
      </dl>

      <section className="mt-5 rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-400/12 to-orange-500/5 p-4" aria-label="Did you know?">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
          <Icon name="lightbulb" size={18} /> Did you know?
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-amber-50">{body.didYouKnow}</p>
      </section>

      <section className="mt-5" aria-label="Interesting facts">
        <h3 className="text-sm font-bold tracking-wide text-slate-300 uppercase">Interesting facts</h3>
        <ul className="mt-2 space-y-2">
          {body.facts.map((fact) => (
            <li key={fact} className="flex gap-3 text-[15px] leading-relaxed text-slate-200">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: body.color }} aria-hidden="true" />
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-5 border-t border-white/8 pt-3 text-xs leading-relaxed text-slate-400">
        Real astronomical data, rounded to friendly numbers. The 3D picture is <strong>not to scale</strong> – planets are drawn bigger and closer together so you can see them.
      </p>
    </motion.div>
  )
}

export function PlanetPanel() {
  const selectedId = useSimulationStore((s) => s.selectedId)
  const infoOpen = useSimulationStore((s) => s.infoOpen)
  const closeInfo = useSimulationStore((s) => s.closeInfo)
  const body = selectedId ? BODIES[selectedId] : null

  return (
    <Panel
      open={infoOpen && body !== null}
      onClose={closeInfo}
      title={body?.name ?? ''}
      eyebrow={body?.kind === 'star' ? 'Our star' : body?.kind === 'moon' ? 'Moon' : 'Planet'}
      accent={body?.color}
      closeLabel="Close information panel"
    >
      {selectedId && <PlanetDetails id={selectedId} />}
    </Panel>
  )
}
