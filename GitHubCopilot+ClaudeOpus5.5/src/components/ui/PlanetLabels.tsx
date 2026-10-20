import { useCallback } from 'react'
import { BODIES, BODY_IDS } from '../../data/planets'
import type { BodyId } from '../../data/types'
import { labelElements } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'

function Label({ id }: { id: BodyId }) {
  const register = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) labelElements.set(id, el)
      else labelElements.delete(id)
    },
    [id],
  )
  return (
    <div ref={register} className="body-label absolute top-0 left-0" style={{ opacity: 0 }}>
      <span className="body-label-dot" style={{ background: BODIES[id].color }} />
      {BODIES[id].name.replace(/^The /, '')}
    </div>
  )
}

/** Planet name tags. Positioned every frame by the 3D LabelManager, so React never re-renders them. */
export function PlanetLabels() {
  const showLabels = useSimulationStore((s) => s.showLabels)
  const is3D = useSimulationStore((s) => s.renderMode === '3d')
  if (!showLabels || !is3D) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {BODY_IDS.map((id) => (
        <Label key={id} id={id} />
      ))}
    </div>
  )
}
