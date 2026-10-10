import { useSimulationStore } from '../../store/simulationStore'
import { PLANETS, SUN_INFO } from '../../data/planets'

export function Tooltip() {
  const hoveredId = useSimulationStore((s) => s.hoveredId)
  if (!hoveredId) return null
  const name = hoveredId === 'sun' ? SUN_INFO.name : PLANETS.find((p) => p.id === hoveredId)?.name
  if (!name) return null
  return (
    <div className="hover-tooltip glass" aria-hidden>
      {name}
      <span className="tooltip-hint">Click to learn more</span>
    </div>
  )
}
