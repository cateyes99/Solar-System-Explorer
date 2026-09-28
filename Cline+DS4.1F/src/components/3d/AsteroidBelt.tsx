import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { IcosahedronGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D } from 'three'
import type { Group } from 'three'
import type { QualityLevel } from '../../types'
import { asteroidBeltRadii } from '../../utils/scale'
import { createRandom, lerp } from '../../utils/random'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { useSimulationStore } from '../../store/simulationStore'

/**
 * The asteroid belt: one instanced mesh for the whole ring.
 *
 * Every rock's position, size and orientation is baked once into the instance
 * matrices, so the belt costs a single draw call and one slowly rotating group
 * each frame — no per-instance work at all.
 */
interface AsteroidBeltProps {
  quality: QualityLevel
  reducedMotion: boolean
}

export function AsteroidBelt({ quality, reducedMotion }: AsteroidBeltProps) {
  const groupRef = useRef<Group>(null)
  const beltRef = useRef<InstancedMesh>(null)
  const anchorRef = useRef<Object3D>(null)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const setHovered = useSimulationStore((state) => state.setHovered)

  const [innerRadius, outerRadius] = asteroidBeltRadii(scaleMode, customScale)
  const count = quality === 'high' ? 1800 : quality === 'medium' ? 1100 : 520

  const { geometry, material, matrices } = useMemo(() => {
    const rockGeometry = new IcosahedronGeometry(1, 0)
    const rockMaterial = new MeshStandardMaterial({ color: '#9a8f80', roughness: 0.96, metalness: 0.04, flatShading: true })
    const random = createRandom(90210)
    const baked = new Array<Matrix4>(count)
    const dummy = new Object3D()
    for (let i = 0; i < count; i += 1) {
      // Slightly clustered toward the middle, like the real belt.
      const t = Math.pow(random(), 0.75)
      const radius = lerp(innerRadius, outerRadius, t)
      const angle = random() * Math.PI * 2
      const y = (random() - 0.5) * (outerRadius - innerRadius) * 0.16
      dummy.position.set(Math.cos(angle) * radius, y, -Math.sin(angle) * radius)
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI)
      // A few big rocks, mostly tiny ones.
      const size = lerp(0.035, 0.24, Math.pow(random(), 2.6)) * (outerRadius - innerRadius) * 0.06
      dummy.scale.set(size * lerp(0.7, 1.3, random()), size * lerp(0.6, 1.1, random()), size * lerp(0.7, 1.3, random()))
      dummy.updateMatrix()
      baked[i] = dummy.matrix.clone()
    }
    return { geometry: rockGeometry, material: rockMaterial, matrices: baked }
  }, [count, innerRadius, outerRadius])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  // The belt is clickable and can be focused, so it registers an anchor point in
  // the middle of the ring (its own origin is the Sun's centre, which is not
  // where we want the camera to fly).
  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    registerBody('belt', anchor)
    return () => unregisterBody('belt', anchor)
  }, [])

  useEffect(() => {
    const mesh = beltRef.current
    if (!mesh) return
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return
    // A very slow drift: the belt completes a lap in a couple of minutes.
    groupRef.current.rotation.y += delta * 0.006
  })

  const midpoint = (innerRadius + outerRadius) / 2

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={beltRef}
        args={[geometry, material, count]}
        frustumCulled={false}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered('belt')
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          event.stopPropagation()
          selectBody('belt')
          focusBody('belt', 'planet', 2.4)
        }}
      />
      <object3D ref={anchorRef} position={[midpoint, 0, 0]} />
    </group>
  )
}