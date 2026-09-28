import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { getPlanet, MOON, SUN } from '../../data/planets'
import { formatDiameter, formatDistance, formatOrbitalPeriod, formatRotationPeriod } from '../../utils/format'
import { CloseIcon } from './icons'

interface Stat {
  label: string
  value: string
}

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-white/5 px-3 py-2">
          <dt className="text-[11px] uppercase tracking-wide text-white/50">{stat.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-white">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function FactsList({ facts }: { facts: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {facts.map((fact) => (
        <li key={fact} className="flex gap-2 text-sm text-white/80">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-glow" />
          <span>{fact}</span>
        </li>
      ))}
    </ul>
  )
}

function PanelShell({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.section
      role="region"
      aria-label={`${title} information`}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="glass-panel pointer-events-auto relative flex max-h-[70vh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl p-5 sm:max-h-[calc(100vh-7rem)] sm:w-96 sm:rounded-3xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel and return to Solar System view"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      {children}
    </motion.section>
  )
}

/** Slides in as a side panel (desktop) or bottom sheet (mobile) with the selected body's facts. */
export function PlanetPanel() {
  const selectedId = useSimulationStore((s) => s.selectedId)
  const resetToSystemView = useSimulationStore((s) => s.resetToSystemView)
  const isSpacecraftMode = useSimulationStore((s) => s.isSpacecraftMode)
  const isTourActive = useSimulationStore((s) => s.isTourActive)

  const hidden = !selectedId || isSpacecraftMode || isTourActive

  return (
    <div className="pointer-events-none relative">
      <AnimatePresence mode="wait">
        {!hidden && selectedId === 'sun' && (
          <PanelShell key="sun" title={SUN.name} onClose={resetToSystemView}>
            <header>
              <p className="text-xs uppercase tracking-wide text-electric-blue">{SUN.type}</p>
              <h2 className="text-glow text-2xl font-semibold text-white">{SUN.name}</h2>
            </header>
            <StatGrid
              stats={[
                { label: 'Diameter', value: formatDiameter(SUN.diameterKm) },
                { label: 'Surface Temp.', value: `~${SUN.surfaceTempC.toLocaleString()}\u00b0C` },
                { label: 'Core Temp.', value: `~${SUN.coreTempC.toLocaleString()}\u00b0C` },
                { label: 'Age', value: `${SUN.ageBillionYears} billion years` },
              ]}
            />
            <p className="text-sm leading-relaxed text-white/80">{SUN.description}</p>
            <div className="rounded-2xl border border-solar-orange/30 bg-solar-orange/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-solar-orange">Did you know?</p>
              <p className="mt-1 text-sm text-white/85">{SUN.didYouKnow}</p>
            </div>
            <FactsList facts={SUN.facts} />
          </PanelShell>
        )}

        {!hidden && selectedId === 'moon' && (
          <PanelShell key="moon" title={MOON.name} onClose={resetToSystemView}>
            <header>
              <p className="text-xs uppercase tracking-wide text-electric-blue">Natural Satellite</p>
              <h2 className="text-glow text-2xl font-semibold text-white">{MOON.name}</h2>
            </header>
            <StatGrid
              stats={[
                { label: 'Diameter', value: formatDiameter(MOON.diameterKm) },
                { label: 'Distance from Earth', value: `${MOON.distanceFromPlanetKm.toLocaleString()} km` },
                { label: 'Orbits Earth every', value: `${MOON.orbitalPeriodDays} days` },
              ]}
            />
            <p className="text-sm leading-relaxed text-white/80">{MOON.description}</p>
          </PanelShell>
        )}

        {!hidden && selectedId && selectedId !== 'sun' && selectedId !== 'moon' && (
          (() => {
            const planet = getPlanet(selectedId)
            return (
              <PanelShell key={planet.id} title={planet.name} onClose={resetToSystemView}>
                <header>
                  <p className="text-xs uppercase tracking-wide text-electric-blue">{planet.type}</p>
                  <h2 className="text-glow text-2xl font-semibold text-white">{planet.name}</h2>
                </header>
                <StatGrid
                  stats={[
                    { label: 'Diameter', value: formatDiameter(planet.diameterKm) },
                    { label: 'Distance from Sun', value: formatDistance(planet.distanceFromSunKm) },
                    { label: 'Length of Year', value: formatOrbitalPeriod(planet.orbitalPeriodDays) },
                    { label: 'Length of Day', value: formatRotationPeriod(planet.rotationPeriodHours) },
                    { label: 'Moons', value: planet.moons.toString() },
                    { label: 'Temperature', value: planet.temperatureC },
                  ]}
                />
                <p className="text-sm leading-relaxed text-white/80">{planet.description}</p>
                <div className="rounded-2xl border border-solar-orange/30 bg-solar-orange/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-solar-orange">Did you know?</p>
                  <p className="mt-1 text-sm text-white/85">{planet.didYouKnow}</p>
                </div>
                <FactsList facts={planet.facts} />
              </PanelShell>
            )
          })()
        )}
      </AnimatePresence>
    </div>
  )
}
