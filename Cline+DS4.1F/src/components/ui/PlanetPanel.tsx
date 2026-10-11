import { AnimatePresence } from 'framer-motion'
import { BODY_BY_ID, satellitesOf } from '../../data/planets'
import { BODY_VISUALS } from '../../data/visuals'
import { useSimulationStore } from '../../store/simulationStore'
import {
  formatDays,
  formatDistanceUnits,
  formatKm,
  formatKmExact,
  formatRotation,
  formatTemperature,
} from '../../utils/format'
import { getDistanceFromSun } from '../../utils/bodyRegistry'
import { Chip, SectionTitle, Sheet, Stat, ToolbarButton } from './primitives'
import { CloseIcon, OrbitIcon, RocketIcon } from './icons'

/**
 * The planet information panel.
 *
 * Every number here is real astronomy (rounded, and labelled as approximate).
 * The panel also makes the visualisation's compromises explicit, so a child
 * learns the science without being misled by the picture.
 */
export function PlanetPanel() {
  const selectedId = useSimulationStore((state) => state.selectedId)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const resetView = useSimulationStore((state) => state.resetView)
  const openEducation = useSimulationStore((state) => state.openEducation)
  const registerDiscovery = useSimulationStore((state) => state.registerDiscovery)
  const discoveries = useSimulationStore((state) => state.discoveries)

  const body = selectedId ? BODY_BY_ID[selectedId] : undefined
  const open = Boolean(body)
  const accent = body ? (BODY_VISUALS[body.id]?.accent ?? body.color) : '#8ab4ff'
  const liveDistanceUnits = body ? getDistanceFromSun(body.id) : 0
  const moons = body ? satellitesOf(body.id) : []

  return (
    <AnimatePresence>
      {open && body ? (
        <Sheet key={body.id} label={`${body.name} information`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="sse-label-text" style={{ color: accent }}>
                {body.type}
              </p>
              <h2 className="sse-text-shadow mt-1 text-xl font-semibold text-parchment">{body.name}</h2>
              <p className="mt-0.5 text-sm italic text-mist/90">{body.tagline}</p>
            </div>
            <button
              type="button"
              aria-label={`Close the ${body.name} information panel`}
              onClick={() => selectBody(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:text-parchment"
            >
              <span aria-hidden="true">
                <CloseIcon />
              </span>
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-parchment/95">{body.description}</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {body.diameterKm > 0 ? <Stat label="Diameter" value={formatKmExact(body.diameterKm)} /> : null}
            {body.kind === 'belt' ? (
              <Stat label="Distance from Sun" value="2.2 – 3.2 AU" hint="330–480 million km" />
            ) : (
              <Stat label="Distance from Sun" value={formatKm(body.distanceFromSunKm)} hint="average" />
            )}
            {body.kind !== 'belt' ? (
              <Stat
                label="Length of year"
                value={
                  body.kind === 'moon'
                    ? '27.3 days around Earth'
                    : body.orbitalPeriodDays > 0
                      ? formatDays(body.orbitalPeriodDays)
                      : '—'
                }
              />
            ) : (
              <Stat label="Orbital period" value="4.6 Earth years" hint="for the rocks in the middle" />
            )}
            {body.rotationPeriodHours !== 0 ? (
              <Stat label="Length of day" value={formatRotation(body.rotationPeriodHours)} />
            ) : null}
            {body.kind === 'star' ? <Stat label="Planets" value="8" hint="plus dwarf planets" /> : null}
            {body.kind === 'planet' || body.kind === 'moon' || body.kind === 'dwarf' ? (
              <Stat label="Moons" value={String(body.moons)} hint="confirmed, rounding up" />
            ) : null}
            {body.surfaceGravity > 0 ? (
              <Stat label="Surface gravity" value={`${body.surfaceGravity.toFixed(2)} m/s²`} hint="how hard it pulls" />
            ) : null}
            <Stat label="Average temperature" value={formatTemperature(body.temperatureC)} />
            {body.kind === 'planet' || body.kind === 'moon' || body.kind === 'dwarf' ? (
              <Stat
                label="Compared with Earth"
                value={
                  body.massEarths >= 1
                    ? `${body.massEarths.toFixed(1)}× the mass`
                    : `${(body.massEarths * 100).toFixed(1)}% of the mass`
                }
              />
            ) : null}
            {body.kind === 'planet' || body.kind === 'moon' || body.kind === 'dwarf' ? (
              <Stat label="Tilt of its axis" value={`${body.axialTiltDeg.toFixed(1)}°`} hint="this makes seasons" />
            ) : null}
          </div>

          {liveDistanceUnits > 0 ? (
            <p className="sse-numeric mt-2 text-[0.68rem] text-mist/80">
              In this view right now it sits {formatDistanceUnits(liveDistanceUnits)} from the Sun.
            </p>
          ) : null}

          <div className="mt-4">
            <SectionTitle hint="things to tell your friends">Cool facts</SectionTitle>
            <ul className="space-y-1.5">
              {body.facts.map((fact) => (
                <li key={fact} className="flex gap-2 text-sm leading-relaxed text-parchment/90">
                  <span aria-hidden="true" style={{ color: accent }}>
                    ●
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="mt-4 rounded-xl border px-3 py-3"
            style={{ borderColor: `${accent}55`, background: `${accent}12` }}
          >
            <p className="sse-label-text" style={{ color: accent }}>
              Did you know?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-parchment">{body.didYouKnow}</p>
          </div>

          {moons.length > 0 ? (
            <div className="mt-4">
              <SectionTitle hint="rendered in the scene">Moons you can spot</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {moons.map((moon) => (
                  <Chip key={moon.id} tone="neutral">
                    {moon.name}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <ToolbarButton icon={<RocketIcon />} compact onClick={() => focusBody(body.id, 'follow', 6)}>
              Follow {body.name}
            </ToolbarButton>
            <ToolbarButton icon={<OrbitIcon />} compact onClick={resetView}>
              Full view
            </ToolbarButton>
            {body.id === 'earth' ? (
              <ToolbarButton compact variant="ghost" onClick={() => openEducation('moon-phases')}>
                Moon phases
              </ToolbarButton>
            ) : null}
            {body.id === 'sun' ? (
              <ToolbarButton
                compact
                variant="ghost"
                onClick={() => {
                  registerDiscovery('sun-student')
                  openEducation('sun')
                }}
              >
                How the Sun shines
              </ToolbarButton>
            ) : null}
          </div>

          <p className="mt-3 text-[0.66rem] leading-relaxed text-mist/75">
            Numbers are rounded real values from NASA and IAU data and are approximate because the planets never stop
            moving. The 3D picture keeps the real orbit spacing but compresses planet sizes so they stay visible.
            {discoveries.length > 0 ? ` Discoveries so far: ${discoveries.length}.` : ''}
          </p>
        </Sheet>
      ) : null}
    </AnimatePresence>
  )
}