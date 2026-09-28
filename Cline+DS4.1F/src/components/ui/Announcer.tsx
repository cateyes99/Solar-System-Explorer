import { BODIES } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * Screen-reader support.
 *
 * Two things a purely visual 3D scene would otherwise hide: a polite live region
 * announcing what just happened, and a plain list of buttons that lets someone
 * navigate by keyboard or with a screen reader alone.
 */
export function Announcer() {
  const selectedId = useSimulationStore((state) => state.selectedId)
  const toast = useSimulationStore((state) => state.toast)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)

  const selected = selectedId ? BODIES.find((body) => body.id === selectedId) : undefined
  const message = toast?.message ?? (selected ? `${selected.name}. ${selected.tagline}.` : '')

  return (
    <>
      <p aria-live="polite" role="status" className="sr-only">
        {message}
      </p>

      <nav aria-label="Jump to a world" className="sr-only">
        <ul>
          {BODIES.map((body) => (
            <li key={body.id}>
              <button
                type="button"
                onClick={() => {
                  selectBody(body.id)
                  focusBody(body.id, 'planet', 6)
                }}
              >
                {body.name} — {body.type}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}