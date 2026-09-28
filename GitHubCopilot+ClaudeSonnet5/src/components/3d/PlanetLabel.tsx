import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

interface PlanetLabelProps {
  name: string
  targetRef: React.RefObject<THREE.Object3D | null>
  visible: boolean
  emphasize?: boolean
  offset?: [number, number, number]
}

const tempVec = new THREE.Vector3()

/**
 * A floating name label anchored to a moving 3D object, rendered natively in
 * WebGL (Billboard + SDF Text) rather than via drei's <Html> DOM portal —
 * @react-three/drei's <Html> creates a nested ReactDOM root per instance,
 * which produces spurious "synchronously unmount a root" console errors
 * when many labels mount at once. Size follows perspective naturally (it's a
 * real 3D object) and opacity fades with camera distance, recomputed every
 * few frames rather than every frame to limit re-renders.
 */
export function PlanetLabel({ name, targetRef, visible, emphasize = false, offset = [0, 0, 0] }: PlanetLabelProps) {
  const { camera } = useThree()
  const [opacity, setOpacity] = useState(1)
  const frameCounter = useRef(0)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!visible) return
    const object = targetRef.current
    if (!object || !groupRef.current) return
    object.getWorldPosition(tempVec)
    const distance = camera.position.distanceTo(tempVec)

    // Keep the label roughly constant-sized on screen instead of shrinking/growing with zoom.
    const scale = THREE.MathUtils.clamp(distance * 0.032, 0.3, 2.2)
    groupRef.current.scale.setScalar(scale)

    frameCounter.current += 1
    if (frameCounter.current % 6 !== 0) return
    const nextOpacity = THREE.MathUtils.clamp(1 - (distance - 50) / 160, 0.12, 1)
    setOpacity((prev) => (Math.abs(prev - nextOpacity) > 0.03 ? nextOpacity : prev))
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={offset}>
      <Billboard>
        <Text
          fontSize={0.5}
          color={emphasize ? '#bff0ff' : '#ffffff'}
          outlineWidth={0.045}
          outlineColor="#03040a"
          outlineOpacity={opacity}
          fillOpacity={opacity}
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  )
}
