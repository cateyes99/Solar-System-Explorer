import { BODIES } from '../../data/planets'
import { BODY_VISUALS } from '../../data/visuals'
import { useSimulationStore } from '../../store/simulationStore'
import type { BodyId } from '../../types'
import { TimeControls } from './TimeControls'
import { audio } from '../../utils/audio'

/** The quick-navigation strip: tap a world and the camera flies there. */
const TIMELINE_ORDER: BodyId[] = [
  'sun',
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'belt',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'comet',
  'halley',
]

export function BottomBar() {
  const selectedId = useSimulationStore((state) => state.selectedId)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const paused = useSimulationStore((state) => state.paused)
  const cinematicActive = useSimulationStore((state) => state.cinematic.active)

  return (
    <footer
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-void/92 via-void/60 to-transparent px-2 pb-2 pt-8 transition-opacity duration-300 sm:px-5 sm:pb-4 ${
        cinematicActive ? 'opacity-65 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[100rem] flex-col gap-2">
        <nav
          aria-label="Quick travel to a world"
          className="sse-scroll -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {TIMELINE_ORDER.map((id) => {
            const body = BODIES.find((candidate) => candidate.id === id)
            if (!body) return null
            const accent = BODY_VISUALS[id]?.accent ?? '#8ab4ff'
            const active = selectedId === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  audio.play('click')
                  selectBody(id)
                  focusBody(id, 'planet', id === 'sun' ? 3.6 : 6)
                }}
                className={`flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-white/40 bg-white/16 text-parchment'
                    : 'border-white/12 bg-void/55 text-mist hover:border-white/25 hover:text-parchment'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 10px 1px ${accent}` }}
                />
                {body.name}
              </button>
            )
          })}
        </nav>

        <div
          role="group"
          aria-label="Time controls"
          className="sse-panel flex flex-wrap items-center gap-2 px-3 py-2"
        >
          <TimeControls />
          <span className="sse-numeric ml-auto hidden text-[0.66rem] text-mist/80 xl:inline">
            {paused ? 'Simulation paused' : 'Simulation running'} · positions from mean orbital elements
          </span>
        </div>
      </div>
    </footer>
  )
}