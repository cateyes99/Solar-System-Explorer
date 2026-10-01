import { AnimatePresence, motion } from 'framer-motion'
import { AU_KM, MOONS, PLANET_BY_ID, SUN } from '../../data/planets'
import { GEOMETRIC_ALBEDO } from '../../data/keplerian'
import { useAppStore } from '../../store/useAppStore'
import { Icon } from './Icon'
import { Button } from './primitives/Button'
import { Pill } from './primitives/Controls'
import { Panel } from './primitives/Panel'
import {
  formatDayHours,
  formatDistanceKm,
  formatNumber,
  formatYears,
  resolveBodyName,
  resolveBodyType,
  sunLightTime,
} from '../../utils/astronomy'
import { spaceAudio } from '../../utils/audio'
import type { CameraMode, PlanetId } from '../../types'

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-edge/60 py-2 last:border-0">
      <div className="min-w-0">
        <dt className="text-[11px] font-medium tracking-wide text-ice-400">{label}</dt>
        {hint && <p className="mt-0.5 text-[10.5px] text-ice-400/60">{hint}</p>}
      </div>
      <dd className="shrink-0 text-right font-mono text-[12.5px] text-ice-50 tabular-nums">{value}</dd>
    </div>
  )
}

export function PlanetPanel() {
  const selectedId = useAppStore((s) => s.selectedId)
  const panel = useAppStore((s) => s.panel)
  const select = useAppStore((s) => s.select)
  const focus = useAppStore((s) => s.focus)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const setCameraMode = useAppStore((s) => s.setCameraMode)
  const greetedEarth = useAppStore((s) => s.greetedEarth)

  const open = panel === 'planet' && selectedId !== null

  return (
    <AnimatePresence>
      {open && selectedId && (
        <Panel
          key="planet"
          title={resolveBodyName(selectedId)}
          eyebrow={resolveBodyType(selectedId)}
          onClose={() => select(null)}
        >
          {selectedId === 'sun' ? (
            <SunContent onSelect={() => select('earth')} />
          ) : selectedId === 'comet' ? (
            <CometContent />
          ) : selectedId === 'luna' || MOONS.some((m) => m.id === selectedId) ? (
            <MoonContent id={selectedId} />
          ) : (
            <PlanetContent
              id={selectedId as PlanetId}
              cameraMode={cameraMode}
              setCameraMode={setCameraMode}
              onFocus={() => focus(selectedId, 'follow')}
              greeted={greetedEarth && selectedId === 'earth'}
            />
          )}
        </Panel>
      )}
    </AnimatePresence>
  )
}

function PlanetContent({
  id,
  cameraMode,
  setCameraMode,
  onFocus,
  greeted,
}: {
  id: PlanetId
  cameraMode: CameraMode
  setCameraMode: (mode: CameraMode) => void
  onFocus: () => void
  greeted: boolean
}) {
  const planet = PLANET_BY_ID[id]
  const moons = MOONS.filter((m) => m.parentId === id)
  const lightTime = sunLightTime(id)
  const albedo = GEOMETRIC_ALBEDO[id]

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {greeted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-cyan-glow/30 bg-cyan-glow/8 px-4 py-3 text-[13px] font-medium text-cyan-100"
          >
            👋 Hello, Earth!
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <p className="text-[14px] leading-relaxed text-ice-200/85">{planet.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill tone="cyan">{planet.tagline}</Pill>
          <Pill tone="muted">Light from the Sun: {lightTime}</Pill>
        </div>
      </div>

      <section>
        <h3 className="eyebrow mb-1">The numbers</h3>
        <dl>
          <StatRow label="Type" value={planet.type} />
          <StatRow label="Diameter" value={`${formatNumber(planet.diameterKm)} km`} />
          <StatRow
            label="Distance from the Sun"
            value={formatDistanceKm(planet.semiMajorAxisAU * AU_KM)}
            hint={`${planet.semiMajorAxisAU.toFixed(2)} astronomical units`}
          />
          <StatRow label="Length of a year" value={formatYears(planet.orbitalPeriodDays)} />
          <StatRow label="Length of a day" value={formatDayHours(planet.rotationPeriodHours)} />
          <StatRow
            label="MOONS"
            value={planet.moonCount === 0 ? 'None' : formatNumber(planet.moonCount)}
            hint={planet.notableMoons.length ? `Including ${planet.notableMoons.join(', ')}` : undefined}
          />
          <StatRow label="Average temperature" value={planet.tempLabel} />
          <StatRow label="Axial tilt" value={`${planet.axialTiltDeg.toFixed(1)}°`} />
          <StatRow
            label="Brightness (albedo)"
            value={albedo !== undefined ? `${Math.round(albedo * 100)}%` : '—'}
            hint="The share of sunlight the planet reflects back into space."
          />
        </dl>
      </section>

      <section>
        <h3 className="eyebrow mb-2">Things to know</h3>
        <ul className="space-y-2.5">
          {planet.funFacts.map((fact) => (
            <li key={fact} className="flex gap-2.5 text-[13px] leading-relaxed text-ice-200/85">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan-glow/70" />
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-solar/25 bg-solar/8 p-4">
        <h3 className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] text-solar uppercase">
          <Icon name="lightbulb" size={15} />
          Did you know?
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ice-100/90">{planet.didYouKnow}</p>
      </section>

      {moons.length > 0 && (
        <section>
          <h3 className="eyebrow mb-2">Moons modelled in the scene</h3>
          <div className="flex flex-wrap gap-1.5">
            {moons.map((moon) => (
              <Pill key={moon.id}>
                {moon.name} · {moon.diameterKm.toLocaleString()} km
              </Pill>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-ice-400/55">
            {planet.moonCount} moons are known in total; only the largest few are drawn here so the scene stays
            readable.
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          icon="target"
          size="md"
          active={cameraMode === 'follow'}
          onClick={() => {
            setCameraMode('follow')
            onFocus()
            spaceAudio.play('focus')
          }}
        >
          Follow {planet.name}
        </Button>
        {cameraMode === 'follow' && (
          <Button icon="eye" size="md" onClick={() => setCameraMode('view-planet')}>
            Stop following
          </Button>
        )}
        <Button
          icon="home"
          size="md"
          onClick={() => {
            useAppStore.getState().viewSystem()
            spaceAudio.play('whoosh')
          }}
        >
          View Solar System
        </Button>
      </div>

      <p className="text-[10.5px] leading-relaxed text-ice-400/55">
        Figures are standard published averages and are rounded. Visual sizes and distances in this app are
        deliberately adjusted so everything stays visible — this is an educational model, not a scale model.
      </p>
      <span className="sr-only" aria-live="polite">
        {planet.name} information panel open
      </span>
    </div>
  )
}

function SunContent({ onSelect }: { onSelect: () => void }) {
  return (
    <div className="space-y-5">
      <p className="text-[14px] leading-relaxed text-ice-200/85">
        The Sun is the star at the heart of everything here. It is not a lamp — it is a colossal furnace that has
        been burning for about 4.6 billion years.
      </p>

      <dl>
        <StatRow label="Type" value="Star (G2V)" />
        <StatRow label="Diameter" value={`${formatNumber(SUN.diameterKm)} km`} hint="About 109 Earths across" />
        <StatRow label="Mass" value="333,000 × Earth" hint="99.86% of the Solar System's mass" />
        <StatRow label="Surface temperature" value="5,500 °C" />
        <StatRow label="Core temperature" value="15 million °C" />
        <StatRow label="Light to Earth" value="8 minutes 20 seconds" />
      </dl>

      <section>
        <h3 className="eyebrow mb-2">Things to know</h3>
        <ul className="space-y-2.5">
          {SUN.facts.map((fact) => (
            <li key={fact} className="flex gap-2.5 text-[13px] leading-relaxed text-ice-200/85">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-solar/70" />
              {fact}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-solar/25 bg-solar/8 p-4">
        <h3 className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] text-solar uppercase">
          <Icon name="lightbulb" size={15} />
          Did you know?
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ice-100/90">{SUN.didYouKnow}</p>
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-edge bg-white/4 px-3.5 py-3">
        <Icon name="sparkle" size={16} className="shrink-0 text-solar" />
        <p className="text-[12px] leading-snug text-ice-200/80">
          Try clicking the Sun three times in a row — it does something rather nice.
        </p>
      </div>

      <Button icon="orbit" onClick={onSelect}>
        Show me Earth instead
      </Button>
    </div>
  )
}

function MoonContent({ id }: { id: string }) {
  const moon = MOONS.find((m) => m.id === id)
  const parent = moon ? PLANET_BY_ID[moon.parentId] : null
  if (!moon || !parent) {
    return <p className="text-[13px] text-ice-200/80">That moon is not modelled in this scene.</p>
  }
  return (
    <div className="space-y-5">
      <p className="text-[14px] leading-relaxed text-ice-200/85">
        {moon.name} orbits {parent.name}. It keeps the same face turned towards its planet forever, because it
        spins exactly once for every trip it makes.
      </p>
      <dl>
        <StatRow label="Diameter" value={`${formatNumber(moon.diameterKm)} km`} />
        <StatRow label="Distance from the planet" value={formatDistanceKm(moon.distanceKm)} />
        <StatRow label="Orbital period" value={formatYears(moon.orbitalPeriodDays)} />
      </dl>
      <section className="rounded-xl border border-solar/25 bg-solar/8 p-4">
        <h3 className="text-[12px] font-semibold tracking-[0.16em] text-solar uppercase">Did you know?</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ice-100/90">
          No wind and no rain on the Moon, so the footprints left by the Apollo astronauts could stay there for
          millions of years.
        </p>
      </section>
    </div>
  )
}

function CometContent() {
  return (
    <div className="space-y-5">
      <p className="text-[14px] leading-relaxed text-ice-200/85">
        You found it. This is a long-period comet on a wildly stretched orbit — it swings in close to the Sun,
        boils into a bright tail, then heads back out towards the edge of the Solar System for another very long
        wait.
      </p>
      <dl>
        <StatRow label="Type" value="Comet" />
        <StatRow label="Orbit" value="Very eccentric and tilted" />
        <StatRow label="Tail" value="Always points away from the Sun" />
      </dl>
      <section className="rounded-xl border border-solar/25 bg-solar/8 p-4">
        <h3 className="text-[12px] font-semibold tracking-[0.16em] text-solar uppercase">Did you know?</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ice-100/90">
          A comet&apos;s tail does not trail behind it like a smoke plume. Solar wind pushes the gas and dust
          directly away from the Sun, so the tail always points back towards the star — which is why comets
          sometimes grow two tails at once.
        </p>
      </section>
    </div>
  )
}