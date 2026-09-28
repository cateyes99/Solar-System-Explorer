import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { BodyId } from '../../types'
import { getBodyWorldPosition } from '../../utils/bodyRegistry'
import { useSimulationStore } from '../../store/simulationStore'
import { Vector3 } from 'three'

/**
 * Planet name labels.
 *
 * DOM labels (not 3D text) so they stay crisp, are readable by screen readers,
 * and can be faded with plain CSS. Each label fades out as its planet shrinks
 * into the distance, which keeps the sky from turning into a jumble of words,
 * and the hovered or selected planet always shows its name clearly.
 */
interface PlanetLabelProps {
  bodyId: BodyId
  name: string
  accent: string
  /** Distance above the planet's centre, in scene units. */
  offset: number
}

export function PlanetLabel({ bodyId, name, accent, offset }: PlanetLabelProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const anchor = new Vector3()

  useFrame(({ camera }) => {
    const element = elementRef.current
    if (!element) return
    const position = getBodyWorldPosition(bodyId, anchor)
    if (!position) return
    const distance = camera.position.distanceTo(position)
    const apparentSize = 2 / Math.max(distance, 0.001)
    const store = useSimulationStore.getState()
    const emphasised = store.hoveredId === bodyId || store.selectedId === bodyId
    const base = Math.min(1, Math.max(0, (apparentSize - 0.0035) / 0.008))
    const opacity = emphasised ? Math.max(base, 0.9) : base * 0.92
    element.style.opacity = opacity.toFixed(3)
    element.style.transform = `translate(-50%, -100%) scale(${emphasised ? 1.06 : 1})`
  })

  return (
    <Html position={[0, offset, 0]} center={false} zIndexRange={[24, 0]} style={{ pointerEvents: 'none' }}>
      <div
        ref={elementRef}
        className="sse-planet-label"
        style={{ borderColor: `${accent}66`, color: accent, opacity: 0 }}
      >
        <span className="sse-planet-label__dot" style={{ background: accent }} aria-hidden="true" />
        {name}
      </div>
    </Html>
  )
}