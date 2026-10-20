import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { BufferGeometry, Color, Float32BufferAttribute, Line } from 'three'
import { BODIES } from '../../data/planets'
import type { PlanetId } from '../../data/types'
import { createOrbitMaterial } from '../../graphics/materials'
import { layoutState, simClock, sunGoneState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { TAU, meanLongitude, orbitPoint } from '../../utils/astronomy'

const SEGMENTS = 256
const WHITE = new Color('#ffffff')

/** Orbit path with a soft glowing trail behind the planet. */
export function Orbit({ id }: { id: PlanetId }) {
  const body = BODIES[id]

  const line = useMemo(() => {
    const orbit = body.orbit
    const positions = new Float32Array((SEGMENTS + 1) * 3)
    const params = new Float32Array(SEGMENTS + 1)
    const point = { x: 0, y: 0, z: 0 }
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      orbitPoint(t * TAU, 1, orbit?.inclinationDeg ?? 0, orbit?.ascendingNodeDeg ?? 0, point)
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      params[i] = t
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aT', new Float32BufferAttribute(params, 1))
    const material = createOrbitMaterial(body.color)
    material.uniforms.uColor.value.lerp(WHITE, 0.35)
    const l = new Line(geometry, material)
    l.frustumCulled = false
    return l
  }, [body])

  useEffect(
    () => () => {
      line.geometry.dispose()
      ;(line.material as ReturnType<typeof createOrbitMaterial>).dispose()
    },
    [line],
  )

  useFrame((_, delta) => {
    const s = useSimulationStore.getState()
    line.visible = s.showOrbits
    if (!line.visible) return
    line.scale.setScalar(layoutState.current.orbit[id])
    const u = (line.material as ReturnType<typeof createOrbitMaterial>).uniforms
    const longitude = meanLongitude(body, simClock.days) / TAU
    u.uPlanetT.value = longitude - Math.floor(longitude)
    const active = s.hoveredId === id || (s.selectedId === id && s.infoOpen)
    const target = active ? 0.55 : 0.16
    u.uOpacity.value += (target - u.uOpacity.value) * Math.min(1, delta * 6)
    u.uTrail.value = sunGoneState.released.has(id) ? 0 : 1
  }, -1)

  return <primitive object={line} />
}
