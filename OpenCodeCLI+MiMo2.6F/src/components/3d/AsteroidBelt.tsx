import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { simClock } from '../../utils/simClock'

/**
 * Instanced asteroid belt between Mars and Jupiter.
 * Two rings orbiting at different rates — one InstancedMesh each with
 * matrices written a single time, so per-frame cost is essentially zero.
 */

interface BeltProps {
  innerAu: number
  outerAu: number
  count: number
  periodDays: number
  seedOffset: number
  thickness: number
}

function Belt({ innerAu, outerAu, count, periodDays, seedOffset, thickness }: BeltProps) {
  const scale = useScale()
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const showAsteroids = useSimStore((s) => s.showAsteroids)

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), [])

  // Write every instance transform exactly once (deterministic pseudo-random)
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    let state = seedOffset * 9301 + 49297
    const rand = () => {
      state = (state * 9301 + 49297) % 233280
      return state / 233280
    }
    for (let i = 0; i < count; i++) {
      const au = innerAu + rand() * (outerAu - innerAu)
      const r = scale.orbitRadius(au)
      const angle = rand() * Math.PI * 2
      dummy.position.set(Math.cos(angle) * r, (rand() - 0.5) * thickness, Math.sin(angle) * r)
      const s = 0.035 + Math.pow(rand(), 2.2) * 0.24
      dummy.scale.set(s * (0.7 + rand() * 0.6), s * (0.7 + rand() * 0.5), s * (0.7 + rand() * 0.7))
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.count = count
  }, [geometry, scale, innerAu, outerAu, count, seedOffset, thickness])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(() => {
    if (groupRef.current && showAsteroids) {
      groupRef.current.rotation.y = (simClock.days / periodDays) * Math.PI * 2
    }
  })

  return (
    <group ref={groupRef} visible={showAsteroids}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, count]}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      >
        <meshStandardMaterial color="#8d8378" roughness={1} metalness={0.05} flatShading />
      </instancedMesh>
    </group>
  )
}

export function AsteroidBelt() {
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const countScale = reducedMotion ? 0.5 : 1

  return (
    <group>
      <Belt
        innerAu={2.05}
        outerAu={2.6}
        count={Math.round(340 * countScale)}
        periodDays={1180}
        seedOffset={1}
        thickness={2.6}
      />
      <Belt
        innerAu={2.7}
        outerAu={3.35}
        count={Math.round(380 * countScale)}
        periodDays={2150}
        seedOffset={2}
        thickness={3.4}
      />
    </group>
  )
}
