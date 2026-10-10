import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { simClock } from '../../utils/clock'
import { useSimulationStore } from '../../store/simulationStore'

const BELT_INNER = 0 // computed from props
const COUNT = 1400

/** Instanced asteroid belt between Mars and Jupiter. */
export function AsteroidBelt({ innerRadius, outerRadius }: { innerRadius: number; outerRadius: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const asteroids = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      radius: innerRadius + Math.random() * (outerRadius - innerRadius),
      angle: Math.random() * Math.PI * 2,
      y: (Math.random() - 0.5) * 3,
      scale: 0.06 + Math.random() * 0.3,
      speed: 0.004 + Math.random() * 0.008,
      tilt: Math.random() * Math.PI,
    }))
  }, [innerRadius, outerRadius])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const days = simClock.days
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i]
      const angle = a.angle + (reducedMotion ? 0 : days * a.speed)
      dummy.position.set(Math.cos(angle) * a.radius, a.y, Math.sin(angle) * a.radius)
      dummy.scale.setScalar(a.scale)
      dummy.rotation.set(a.tilt, angle, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8a7a6a" roughness={1} metalness={0} />
    </instancedMesh>
  )
}
