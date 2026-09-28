import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'

interface AsteroidBeltProps {
  innerRadius: number
  outerRadius: number
  count?: number
}

const dummy = new THREE.Object3D()

/** Thousands of rocky fragments rendered as a single InstancedMesh for performance. */
export function AsteroidBelt({ innerRadius, outerRadius, count = 1800 }: AsteroidBeltProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c8378', roughness: 1, metalness: 0.05 }), [])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || outerRadius <= innerRadius) return

    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * (outerRadius - innerRadius) * 0.1
      const scale = 0.025 + Math.random() * 0.085

      dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const shade = 0.6 + Math.random() * 0.55
      color.setRGB(shade * 0.55, shade * 0.5, shade * 0.46)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, innerRadius, outerRadius])

  useFrame((_, delta) => {
    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.y += delta * 0.008
    }
  })

  if (outerRadius <= innerRadius) return null

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />
}
