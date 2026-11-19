import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Group, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import { PLANET_MAP } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { simulationClock } from '../../utils/simulationClock'
import { getOrbitRadius } from '../../utils/scale'

export function AsteroidBelt() {
  const mesh = useRef<InstancedMesh>(null)
  const group = useRef<Group>(null)
  const quality = useSimulationStore((state) => state.quality)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customDistance = useSimulationStore((state) => state.customDistance)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const count = quality === 'low' ? 450 : 1100
  const marsOrbit = getOrbitRadius(PLANET_MAP.mars, scaleMode, customDistance)
  const jupiterOrbit = getOrbitRadius(PLANET_MAP.jupiter, scaleMode, customDistance)
  const center = (marsOrbit + jupiterOrbit) / 2
  const width = Math.max(2, (jupiterOrbit - marsOrbit) * 0.42)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const matrix = new Matrix4()
    const position = new Vector3()
    const rotation = new Quaternion()
    const scale = new Vector3()
    const color = new Color()
    let seed = 4813
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2
      const radius = center + (random() - 0.5) * width
      position.set(Math.cos(angle) * radius, (random() - 0.5) * 1.25, Math.sin(angle) * radius)
      rotation.setFromAxisAngle(new Vector3(random(), random(), random()).normalize(), random() * Math.PI)
      const size = 0.35 + random() ** 2 * 1.65
      scale.set(size, size * (0.55 + random() * 0.6), size)
      matrix.compose(position, rotation, scale)
      mesh.current.setMatrixAt(index, matrix)
      color.set(random() > 0.5 ? '#796b5c' : '#9a8874')
      mesh.current.setColorAt(index, color)
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [count, center, width])

  useFrame(() => {
    if (group.current) group.current.rotation.y = (simulationClock.days / 1600) * Math.PI * 2 * (reducedMotion ? 0.15 : 1)
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <dodecahedronGeometry args={[0.075, 0]} />
        <meshStandardMaterial roughness={1} metalness={0.05} />
      </instancedMesh>
    </group>
  )
}
