import { PLANETS } from '../../data/planets'

interface Fallback2DProps {
  /** 'webgl' when the GPU can't do 3D, 'error' when the scene crashed */
  reason: 'webgl' | 'error'
}

const ORBIT_STYLES: { radius: number; duration: number }[] = [
  { radius: 54, duration: 6 },
  { radius: 76, duration: 9 },
  { radius: 98, duration: 14 },
  { radius: 120, duration: 21 },
  { radius: 150, duration: 40 },
  { radius: 176, duration: 62 },
  { radius: 202, duration: 92 },
  { radius: 226, duration: 140 },
]

/**
 * Graceful 2D fallback: every planet still orbits, every planet is still
 * clickable — no WebGL required.
 */
export function Fallback2D({ reason }: Fallback2DProps) {
  return (
    <main className="grid min-h-full place-items-center bg-space-950 px-4 py-10">
      <div className="w-full max-w-3xl text-center">
        <div
          className="mx-auto mb-6 rounded-3xl border border-white/10 bg-space-900/70 p-6"
          role="alert"
        >
          <h1 className="font-display text-2xl font-bold text-white">
            {reason === 'webgl'
              ? 'Your browser cannot display the 3D Solar System'
              : 'The 3D scene hit a problem'}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/70">
            {reason === 'webgl'
              ? '3D graphics are unavailable on this device or browser. You can still explore a simplified 2D Solar System below — every planet still orbits and every planet still has facts to discover.'
              : 'Something went wrong while drawing the 3D scene, so we switched you to the 2D version. Reloading the page usually fixes it.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="chip"
              onClick={() => window.location.reload()}
              aria-label="Reload the page"
            >
              Reload the page
            </button>
            <a
              className="chip"
              href="https://get.webgl.org/"
              target="_blank"
              rel="noreferrer"
            >
              Learn about WebGL
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
            Tip: enable hardware acceleration in your browser settings (Settings → System → Use
            hardware acceleration when available) and try again for the full 3D experience.
          </p>
        </div>

        <section aria-label="Simplified 2D Solar System" className="rounded-3xl border border-white/10 bg-space-900/50 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-cyan-200">
            Simplified 2D Solar System
          </h2>

          <div className="relative mx-auto aspect-square w-full max-w-xl">
            {/* Sun */}
            <span
              className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-solar-400 shadow-[0_0_40px_rgba(255,179,71,0.8)]"
              aria-hidden="true"
            />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-8 font-display text-xs text-solar-200">
              The Sun
            </span>

            {PLANETS.map((planet, index) => {
              const orbit = ORBIT_STYLES[index]
              return (
                <div key={planet.id}>
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
                    style={{ width: orbit.radius * 2, height: orbit.radius * 2 }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute left-1/2 top-1/2 animate-[orbit-spin_linear_infinite]"
                    style={{
                      width: orbit.radius * 2,
                      height: orbit.radius * 2,
                      marginLeft: -orbit.radius,
                      marginTop: -orbit.radius,
                      animationDuration: `${orbit.duration}s`,
                    }}
                    aria-hidden="true"
                  >
                    <span
                      className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: Math.max(8, 10 + Math.log10(planet.diameterKm / 4000) * 9),
                        height: Math.max(8, 10 + Math.log10(planet.diameterKm / 4000) * 9),
                        background: planet.color,
                        boxShadow: `0 0 12px ${planet.color}`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {PLANETS.map((planet) => (
              <li key={planet.id}>
                <details className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left">
                  <summary className="cursor-pointer font-display text-sm font-semibold text-white">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                      style={{ background: planet.color }}
                    />
                    {planet.name}
                  </summary>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">{planet.description}</p>
                  <p className="mt-1 text-[11px] text-cyan-200">
                    {planet.diameterKm.toLocaleString()} km · {planet.facts[0]}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
