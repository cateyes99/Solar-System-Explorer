const FALLBACK_PLANETS = [
  { name: 'Mercury', color: '#9c9088', size: 6, orbit: 34 },
  { name: 'Venus', color: '#e8cf9a', size: 9, orbit: 50 },
  { name: 'Earth', color: '#2f6fb0', size: 9, orbit: 66 },
  { name: 'Mars', color: '#b8502f', size: 7, orbit: 82 },
  { name: 'Jupiter', color: '#d8b48c', size: 17, orbit: 108 },
  { name: 'Saturn', color: '#e3cf9d', size: 15, orbit: 134 },
  { name: 'Uranus', color: '#a6e3e0', size: 11, orbit: 156 },
  { name: 'Neptune', color: '#3a5fcf', size: 11, orbit: 176 },
]

/** Polished, static fallback shown when WebGL is unavailable or the 3D scene crashes. */
export function WebGLFallback() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-space-black px-6 py-10 text-center">
      <h1 className="text-glow text-2xl font-semibold text-white">A 3D Experience Awaits — Almost!</h1>
      <p className="max-w-md text-sm leading-relaxed text-white/70">
        Your browser or graphics hardware cannot display the interactive 3D Solar System right now. Here is a
        simplified 2D view instead. For the full experience, try a recent version of Chrome, Edge, or Firefox on a
        device with graphics acceleration enabled.
      </p>

      <div className="relative flex h-[200px] w-[200px] items-center justify-center sm:h-[380px] sm:w-[380px]">
        <div className="absolute h-6 w-6 rounded-full bg-solar-orange shadow-[0_0_20px_6px_rgba(255,157,77,0.6)]" />
        {FALLBACK_PLANETS.map((planet) => (
          <div
            key={planet.name}
            className="absolute animate-spin rounded-full border border-white/10"
            style={{ width: planet.orbit * 2, height: planet.orbit * 2, animationDuration: `${planet.orbit / 4}s` }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: planet.size,
                height: planet.size,
                backgroundColor: planet.color,
                top: '50%',
                left: '100%',
                transform: 'translate(-50%, -50%)',
              }}
              title={planet.name}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-electric-blue/20 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-electric-blue/50 hover:bg-electric-blue/30"
      >
        Try Again
      </button>
    </div>
  )
}
