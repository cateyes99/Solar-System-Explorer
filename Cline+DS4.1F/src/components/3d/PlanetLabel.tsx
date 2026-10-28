import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Group } from 'three'
import type { BodyId } from '../../types'
import { getBodyOccluders, getBodyWorldPosition } from '../../utils/bodyRegistry'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * Planet name labels.
 *
 * DOM labels (not 3D text) so they stay crisp, are readable by screen readers,
 * and can be faded with plain CSS. Each label fades out as its planet shrinks
 * into the distance, which keeps the sky from turning into a jumble of words,
 * and the hovered or selected planet always shows its name clearly.
 *
 * A DOM label is not part of the WebGL depth buffer, so the GPU never occludes
 * it — left alone, a label draws on top of whatever stands in front of it. The
 * ray from the camera to the label's own anchor is therefore tested against the
 * bodies' spheres each frame, and the label fades out whenever a body is nearer
 * than the anchor. That is a property of the label alone: it hides when the
 * label is blocked, whether or not the body the label names is itself visible.
 */
interface PlanetLabelProps {
  bodyId: BodyId
  name: string
  accent: string
  /** Distance above the planet's centre, in scene units. */
  offset: number
}

/** Per-frame scratch for the occlusion test, shared by every label. */
const ray = new Vector3()
const occluderCentre = new Vector3()

export function PlanetLabel({ bodyId, name, accent, offset }: PlanetLabelProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<Group>(null)
  const bodyCentre = new Vector3()
  const labelPosition = new Vector3()
  /** 1 while the label is clear, easing to 0 while a body blocks it. */
  const visibility = useRef(1)

  useFrame(({ camera }, delta) => {
    const element = elementRef.current
    const label = labelRef.current
    if (!element || !label) return
    const position = getBodyWorldPosition(bodyId, bodyCentre)
    if (!position) return
    const distance = camera.position.distanceTo(position)
    const apparentSize = 2 / Math.max(distance, 0.001)
    const store = useSimulationStore.getState()
    const emphasised = store.hoveredId === bodyId || store.selectedId === bodyId
    const base = Math.min(1, Math.max(0, (apparentSize - 0.0035) / 0.008))

    // Is the label itself behind a body? Cast from the camera to the label's own
    // anchor and look for a body sphere in between. Independent of the named
    // body: this hides a label blocked by any other body, too.
    label.getWorldPosition(labelPosition)
    ray.copy(labelPosition).sub(camera.position)
    const labelDistance = ray.length()
    let blocked = false
    if (labelDistance > 1e-6) {
      ray.divideScalar(labelDistance)
      for (const body of getBodyOccluders()) {
        body.object.getWorldPosition(occluderCentre).sub(camera.position)
        const along = occluderCentre.dot(ray)
        // The body is behind the camera, so it cannot block this label.
        if (along <= 0) continue
        const perpendicularSq = occluderCentre.lengthSq() - along * along
        const radiusSq = body.radius * body.radius
        // The ray misses the body's disc.
        if (perpendicularSq > radiusSq) continue
        const near = along - Math.sqrt(radiusSq - perpendicularSq)
        if (near > 0 && near < labelDistance) {
          blocked = true
          break
        }
      }
    }
    visibility.current += ((blocked ? 0 : 1) - visibility.current) * Math.min(1, delta * 12)

    const opacity = (emphasised ? Math.max(base, 0.9) : base * 0.92) * visibility.current
    element.style.opacity = opacity.toFixed(3)
    element.style.transform = `translate(-50%, -100%) scale(${emphasised ? 1.06 : 1})`
  })

  return (
    <group ref={labelRef} position={[0, offset, 0]}>
      <Html center={false} zIndexRange={[24, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={elementRef}
          className="sse-planet-label"
          style={{ borderColor: `${accent}66`, color: accent, opacity: 0 }}
        >
          <span className="sse-planet-label__dot" style={{ background: accent }} aria-hidden="true" />
          {name}
        </div>
      </Html>
    </group>
  )
}
