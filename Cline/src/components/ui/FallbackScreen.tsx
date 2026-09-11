import { MiniSystem } from './LoadingScreen'

/**
 * Polished fallback for missing WebGL (or a crashed canvas):
 * explains the problem and still offers a charming 2D mini solar system.
 */
export function FallbackScreen(): JSX.Element {
  return (
    <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center overflow-auto bg-space-950 p-6 text-center">
      <MiniSystem paused />
      <h1 className="mt-8 max-w-xl font-display text-xl font-bold text-white md:text-2xl">
        Your browser or graphics hardware cannot display the 3D Solar System.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
        Don't worry — the universe is still out there! Try opening this page in a recent version of
        Chrome, Edge, Firefox or Safari with hardware acceleration enabled.
      </p>
      <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.reload()}>
        ↻ Try again
      </button>
      <p className="mt-8 text-[11px] text-white/35">
        Fun fact while you wait: a day on Venus is longer than a year on Venus!
      </p>
    </div>
  )
}
