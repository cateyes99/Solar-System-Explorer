import { AnimatePresence, motion } from 'framer-motion'
import { BODY_BY_ID } from '../../data/planets'
import { useSimStore } from '../../store/simulationStore'
import { usePlanetFocus } from '../../hooks/usePlanetFocus'
import { formatDay, formatDistance, formatYear } from '../../utils/astronomy'
import { CloseIcon, CrosshairIcon, GlobeIcon, RocketIcon, RouteIcon } from './icons'
import { sendCraftCommand } from '../../utils/telemetry'
import { playBlip } from '../../utils/audio'

interface StatProps {
  label: string
  value: string
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/70">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-white">{value}</dd>
    </div>
  )
}

/**
 * Planet information panel: a right-hand dock on desktop and a bottom sheet
 * on phones/tablets.
 */
export function PlanetPanel() {
  const selectedId = useSimStore((s) => s.selectedId)
  const setSpacecraftActive = useSimStore((s) => s.setSpacecraftActive)
  const openPanel = useSimStore((s) => s.openPanel)
  const { focus, follow, dismiss, home } = usePlanetFocus()

  const body = selectedId ? BODY_BY_ID[selectedId] : undefined
  const isMoon = selectedId === 'moon'
  const isSun = selectedId === 'sun'

  return (
    <AnimatePresence>
      {body && (
        <motion.aside
          key={body.id}
          role="dialog"
          aria-labelledby="planet-panel-title"
          aria-modal="false"
          initial={{ opacity: 0, x: 40, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="panel fixed z-30 flex max-h-[62svh] w-full flex-col overflow-hidden rounded-t-3xl
                     inset-x-0 bottom-0
                     md:inset-x-auto md:right-3 md:top-24 md:bottom-40 md:max-h-none md:w-[22rem] md:rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-white/10 px-4 py-3">
            <span
              className="mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-white/30"
              style={{ background: body.color, boxShadow: `0 0 14px ${body.color}` }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <h2 id="planet-panel-title" className="font-display text-xl font-bold text-white">
                {body.name}
              </h2>
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-300/80">{body.type}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="chip !px-2 !py-1"
              aria-label="Close information panel"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <p className="text-sm leading-relaxed text-white/85">{body.description}</p>

            <dl className="grid grid-cols-2 gap-2">
              <Stat label="Diameter" value={`${body.diameterKm.toLocaleString()} km`} />
              <Stat
                label={isMoon ? 'Distance from Earth' : 'Distance from Sun'}
                value={isMoon ? '384,400 km (average)' : formatDistance(body.distanceFromSunKm)}
              />
              <Stat
                label={isSun ? 'Galactic year' : 'Length of year'}
                value={isSun ? '~230 million Earth years' : formatYear(body.orbitalPeriodDays)}
              />
              <Stat label="Length of day" value={formatDay(body.rotationPeriodHours)} />
              <Stat label="Moons" value={isSun ? '—' : `${body.moons}`} />
              <Stat
                label="Temperature"
                value={`${body.temperatureC.toLocaleString()}°C average`}
              />
            </dl>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <h3 className="hud-title mb-1.5 text-[11px] text-solar-400">Good to know</h3>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-white/80">
                {body.facts.map((fact) => (
                  <li key={fact} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-300" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-solar-400/30 bg-solar-400/10 p-3">
              <h3 className="hud-title mb-1 text-[11px] text-solar-400">Did you know?</h3>
              <p className="text-[13px] leading-relaxed text-solar-200">{body.didYouKnow}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-4 py-3">
            <button type="button" className="chip" onClick={() => focus(body.id)}>
              <CrosshairIcon width={14} height={14} /> View planet
            </button>
            <button type="button" className="chip" onClick={() => follow(body.id)}>
              <RouteIcon width={14} height={14} /> Follow
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setSpacecraftActive(true)
                sendCraftCommand({ kind: 'body', id: body.id })
                playBlip(760, 0.12)
              }}
            >
              <RocketIcon width={14} height={14} /> Fly there
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                openPanel('learn', 'sizes')
                home()
              }}
            >
              Compare sizes
            </button>
            <button type="button" className="chip" onClick={home}>
              <GlobeIcon width={14} height={14} /> System view
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
