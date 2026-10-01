import { useState } from 'react'
import { motion } from 'framer-motion'
import { COMETS, ORBITING_WORLDS } from '../../data/planets'
import { formatDays, formatKm, formatTemperature } from '../../utils/format'

/** Every world the simplified view offers, in the order they sit out from the Sun. */
const FALLBACK_WORLDS = [...ORBITING_WORLDS, ...COMETS]

/**
 * The 2D fallback.
 *
 * If the browser cannot give us WebGL 2 (or the renderer fails to start), the
 * child still gets a Solar System to explore: a hand-built CSS orrery plus the
 * same real data, so nobody is left staring at an error message.
 */
export function Fallback2D({ reason }: { reason?: string }) {
  const [selectedId, setSelectedId] = useState('earth')
  const selected = FALLBACK_WORLDS.find((world) => world.id === selectedId) ?? FALLBACK_WORLDS[2]

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-[radial-gradient(circle_at_50%_28%,#0b1330_0%,#04060f_70%)] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <p className="sse-label-text text-solar">Simplified 2D view</p>
        <h2 className="mt-1 text-xl font-semibold text-parchment">
          Your browser or graphics hardware cannot display the 3D Solar System
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-mist/90">
          The 3D experience needs WebGL 2, which this device could not provide. Here is a 2D Solar System instead — the
          astronomy is exactly the same, and every planet still has its real data.
          {reason ? ` (${reason})` : ''}
        </p>

        <div className="sse-panel mt-5 p-4">
          <div className="relative mx-auto aspect-square w-full max-w-[22rem]">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 36% 32%, #fff6d0 0%, #ffbf49 45%, #ff7a18 75%, rgba(255,90,0,0) 78%)',
                boxShadow: '0 0 50px 12px rgba(255,138,43,0.35)',
              }}
            />
            {ORBITING_WORLDS.map((world, index) => {
              const size = 34 + index * 9
              const duration = 8 + index * 3.4
              return (
                <span
                  key={world.id}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 rounded-full border"
                  style={{
                    width: `${size}%`,
                    height: `${size}%`,
                    marginLeft: `-${size / 2}%`,
                    marginTop: `-${size / 2}%`,
                    borderColor: selectedId === world.id ? world.color : 'rgba(120,190,255,0.18)',
                    animation: `orbit-spin ${duration}s linear infinite`,
                  }}
                >
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: 10,
                      height: 10,
                      marginLeft: -5,
                      marginTop: -5,
                      left: '50%',
                      top: 0,
                      background: world.color,
                      boxShadow: `0 0 10px 2px ${world.color}`,
                    }}
                  />
                </span>
              )
            })}
          </div>

          <ul className="mt-4 flex flex-wrap justify-center gap-1.5">
            {FALLBACK_WORLDS.map((world) => (
              <li key={world.id}>
                <button
                  type="button"
                  aria-pressed={selectedId === world.id}
                  onClick={() => setSelectedId(world.id)}
                  className={`min-h-[2.75rem] rounded-lg border px-3 text-xs transition-colors ${
                    selectedId === world.id
                      ? 'border-ice/60 bg-ice/20 text-parchment'
                      : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
                  }`}
                >
                  {world.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="sse-panel mt-5 p-4"
        >
          <h3 className="text-lg font-semibold" style={{ color: selected.color }}>
            {selected.name}
          </h3>
          <p className="text-xs italic text-mist/90">{selected.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-parchment/95">{selected.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5">
              <dt className="sse-label-text text-[0.55rem]">Diameter</dt>
              <dd className="sse-numeric text-parchment">{formatKm(selected.diameterKm)}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5">
              <dt className="sse-label-text text-[0.55rem]">Distance from Sun</dt>
              <dd className="sse-numeric text-parchment">{formatKm(selected.distanceFromSunKm)}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5">
              <dt className="sse-label-text text-[0.55rem]">Year</dt>
              <dd className="sse-numeric text-parchment">{formatDays(selected.orbitalPeriodDays)}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5">
              <dt className="sse-label-text text-[0.55rem]">Temperature</dt>
              <dd className="sse-numeric text-parchment">{formatTemperature(selected.temperatureC)}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5">
              <dt className="sse-label-text text-[0.55rem]">Moons</dt>
              <dd className="sse-numeric text-parchment">{selected.moons}</dd>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5">
              <dt className="sse-label-text text-[0.55rem]">Gravity</dt>
              <dd className="sse-numeric text-parchment">{selected.surfaceGravity.toFixed(2)} m/s²</dd>
            </div>
          </dl>
          <p className="mt-3 rounded-lg border border-ice/25 bg-ice/8 px-3 py-2 text-xs text-parchment/95">
            {selected.didYouKnow}
          </p>
          <ul className="mt-3 space-y-1">
            {selected.facts.map((fact) => (
              <li key={fact} className="flex gap-2 text-xs leading-relaxed text-parchment/90">
                <span aria-hidden="true" style={{ color: selected.color }}>
                  ●
                </span>
                {fact}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="mt-4 text-[0.68rem] leading-relaxed text-mist/75">
          Tip: a modern browser such as Chrome, Edge, Firefox or Safari with hardware acceleration enabled will unlock
          the full 3D experience.
        </p>
      </div>
    </div>
  )
}