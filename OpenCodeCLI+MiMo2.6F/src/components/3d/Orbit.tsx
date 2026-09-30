import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { Body } from '../../data/planets'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { orbitalPosition } from '../../utils/astronomy'

interface OrbitProps {
  body: Body
}

/**
 * Elliptical orbital path drawn from the same elements used for motion,
 * so the line and the planet always agree.
 */
export function Orbit({ body }: OrbitProps) {
  const scale = useScale()
  const selectedId = useSimStore((s) => s.selectedId)
  const hoveredId = useSimStore((s) => s.hoveredId)
  const showOrbits = useSimStore((s) => s.showOrbits)
  const reducedMotion = useSimStore((s) => s.reducedMotion)

  const line = useMemo(() => {
    const segments = 220
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const days = (i / segments) * body.orbitalPeriodDays
      const state = orbitalPosition(body.elements, days)
      const r = scale.orbitRadius(state.distanceAu)
      points.push(new THREE.Vector3(Math.cos(state.angle) * r, 0, Math.sin(state.angle) * r))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(body.color),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
    return new THREE.LineLoop(geometry, material)
  }, [body, scale])

  useEffect(
    () => () => {
      line.geometry.dispose()
      ;(line.material as THREE.Material).dispose()
    },
    [line],
  )

  const isSelected = selectedId === body.id
  const isHovered = hoveredId === body.id
  const material = line.material as THREE.LineBasicMaterial
  material.opacity = isSelected ? 0.75 : isHovered ? 0.45 : 0.18
  material.color.set(isSelected || isHovered ? '#8be9ff' : body.color)
  line.visible = showOrbits
  line.renderOrder = reducedMotion ? -2 : -1

  return <primitive object={line} />
}
