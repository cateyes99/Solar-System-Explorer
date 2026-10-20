import { useMemo } from 'react'
import * as THREE from 'three'
import { DEG } from '../../utils/astronomy'

interface OrbitProps {
  radius: number
  inclinationDeg?: number
  ascendingNodeDeg?: number
  color?: string
  opacity?: number
  segments?: number
}

function circleGeometry(radius: number, segments: number): THREE.BufferGeometry {
  const points: number[] = []
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    points.push(Math.cos(a) * radius, 0, -Math.sin(a) * radius)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return geometry
}

/** A circular orbit line, inclined and oriented like the real orbit. */
export function Orbit({
  radius,
  inclinationDeg = 0,
  ascendingNodeDeg = 0,
  color = '#5b7fbf',
  opacity = 0.3,
  segments = 192,
}: OrbitProps): JSX.Element {
  const geometry = useMemo(() => circleGeometry(radius, segments), [radius, segments])
  return (
    <group rotation={[0, ascendingNodeDeg * DEG, 0]}>
      <group rotation={[inclinationDeg * DEG, 0, 0]}>
        <lineLoop geometry={geometry} frustumCulled={false}>
          <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
        </lineLoop>
      </group>
    </group>
  )
}
